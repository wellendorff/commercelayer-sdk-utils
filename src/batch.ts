import type { ApiError, CommerceLayerClient, QueryParams, QueryParamsList, SdkError } from "@commercelayer/sdk"
import type { CreatableResourceType, DeletableResourceType, ListableResourceType, ResourceTypeLock, RetrievableResourceType, UpdatableResourceType } from "@commercelayer/sdk/lib/cjs/api"
import type { ListResponse, Resource, ResourceCreate, ResourceId, ResourceUpdate, ResourcesConfig } from "@commercelayer/sdk/lib/cjs/resource"
import CommerceLayerUtils from './init'
import { computeRateLimits, headerRateLimits, type RateLimitInfo } from "./rate_limit"
import { invalidToken, sleep } from "./common"

/*
createAll: 		KO, can be done with imports
deleteAll: 		KO, can be done with cleanups
updateAll:		OK, update of known resources can be done with imports, but would be useful a feature to update resources using a filter
retrieveAll:	OK, list all resources with pagination, zero offset and token refresh (listAll)
*/

export type TaskOperation = 'retrieve' | 'list' | 'create' | 'update' | 'delete'

export type TaskResult = Resource | Resource[] | undefined


export class InvalidTokenError extends Error {
	readonly cause: ApiError
	constructor(error: ApiError) {
		super(error.first().detail)
		this.cause = error
	}
}


type SuccessCallback = (output: TaskResult, task: Task) => Promise<void> | void
type FailureCallback = (error: SdkError, task: Task) => Promise<boolean> | boolean
type TokenCallback = (error: InvalidTokenError, task: Task) => Promise<string> | string

export type TemplateTask = Partial<Task>

type Task = {
	label?: string
	resourceType: ResourceTypeLock
	operation: TaskOperation
	params?: QueryParams
	options?: ResourcesConfig
	executed?: boolean
	onSuccess?: {
		callback?: SuccessCallback
		result?: TaskResult,
	},
	onFailure?: {
		error?: SdkError
		haltOnError?: boolean
		errorHandler?: FailureCallback
	}
} & ({
	resourceType: CreatableResourceType,
	operation: 'create',
	resource: ResourceCreate & Record<string, any>
} | {
	resourceType: UpdatableResourceType,
	operation: 'update',
	resource: ResourceUpdate & Record<string, any>
} | {
	resourceType: DeletableResourceType,
	operation: 'delete',
	resource: string | ResourceId
} | {
	resourceType: ListableResourceType,
	operation: 'list',
	params?: QueryParamsList
} | {
	resourceType: RetrievableResourceType,
	operation: 'retrieve',
	resource: string | ResourceId
})


export type BatchResult = {
	startedAt: Date,
	finishedAt?: Date
}


export type BatchOptions = {
	haltOnError?: boolean,
	refreshToken?: TokenCallback
}


type Batch = {
	tasks: Task[]
	rateLimits?: Partial<Record<ResourceTypeLock, Partial<Record<TaskOperation, RateLimitInfo>>>>
	running?: boolean
	runningTask?: string,
	options?: BatchOptions
}



const taskRateLimit = (batch: Batch, task: Task, info?: RateLimitInfo): RateLimitInfo | undefined => {

	if (info) {
		if (!batch.rateLimits) batch.rateLimits = {}
		Object.assign(batch.rateLimits || {}, { [task.resourceType]: { [task.operation]: info } })
	}

	const resLimits = batch.rateLimits?.[task.resourceType]
	return resLimits ? resLimits[task.operation] : undefined

}



const executeTask = async (cl: CommerceLayerClient, task: Task, options: BatchOptions = {}): Promise<TaskResult> => {

	const client = cl[task.resourceType]
	let out: TaskResult

	try {

		task.executed = false

		const op = client[task.operation as keyof typeof client] as any
		if (!op) throw new Error(`Unsupported operation [resource: ${task.resourceType}, operation: ${task.operation}]`)

		if (task.operation === 'list') {
			out = await (client[task.operation as keyof typeof client] as any)(task.params, task.options) as ListResponse<Resource>
		} else {
			out = await (client[task.operation as keyof typeof client] as any)(task.resource, task.params, task.options) as Resource
		}

		if (!task.onSuccess) task.onSuccess = {}
		const success = task.onSuccess
		success.result = out
		if (success.callback) try { await success.callback(success.result, task) } catch(err) {}

		return out

	} catch (error: unknown) {

		if (invalidToken(error)) throw new InvalidTokenError(error)

		if (!task.onFailure) task.onFailure = {}
		const failure = task.onFailure
		failure.error = error as SdkError
		let halt = options.haltOnError || failure.haltOnError
		if (failure.errorHandler) try { halt = halt || await failure.errorHandler(failure.error, task) } catch (err) {}
		if (halt) throw error

	} finally {
		task.executed = true
	}

}


const resolvePlaceholders = (task: Task, last: TaskResult): void => {
	// Fill task placeholders with values coming from previous task result
}


const executeBatch = async (batch: Batch): Promise<BatchResult> => {

	const cl = CommerceLayerUtils().sdk
	const rrr = cl.addRawResponseReader({ headers: true })
	batch.running = false

	const result: BatchResult = {
		startedAt: new Date()
	}

	let runningIndex = -1
	let lastResult: TaskResult
	for (const task of batch.tasks) {

		runningIndex++
		batch.running = true
		batch.runningTask = task.label || String(runningIndex)

		let rateLimit = taskRateLimit(batch, task)
		if (rateLimit) await sleep(rateLimit.delay)

		try {
			if (lastResult) resolvePlaceholders(task, lastResult)
			lastResult = await executeTask(cl, task, batch.options)
		} catch (err: unknown) {
			// Refresh access token if needed and re-execute the task
			if ((err instanceof InvalidTokenError) && batch.options?.refreshToken) {
				const newAccessToken = await batch.options.refreshToken(err, task)
				cl.config({ accessToken: newAccessToken })
				await executeTask(cl, task, batch.options)
			} else throw err
		}

		if (!rateLimit) try {
			// Compute and store rate limit for this kind of resource/operation
			const rateLimits = headerRateLimits(rrr.headers)
			rateLimit = computeRateLimits(rateLimits, task, batch.tasks)
			taskRateLimit(batch, task, rateLimit)
		} catch (error: any) {}

	}

	if (cl && rrr) cl.removeRawResponseReader(rrr)

	result.finishedAt = new Date()

	return result

}


const batch = {
	executeBatch
}


export { batch, executeBatch }

export type { Batch, Task }
