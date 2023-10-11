import type { ApiError, QueryParamsList } from "@commercelayer/sdk"
import CommerceLayerUtils from "./init"
import type { ListableResourceType, UpdatableResourceType } from "@commercelayer/sdk/lib/cjs/api"
import type { ListResponse, Resource, ResourceUpdate } from "@commercelayer/sdk/lib/cjs/resource"
import { config } from "./config"
import { type RateLimitInfo, computeRateLimits, headerRateLimits } from "./rate_limit"
import { sleep } from "./common"


type AllParams = Omit<QueryParamsList, 'pageSize' | 'pageNumber' | 'sort'>


export const retrieveAll = async <R extends Resource>(resourceType: ListableResourceType, params?: AllParams): Promise<ListResponse<R>> => {

	const cl = CommerceLayerUtils().sdk
	const client = cl[resourceType]
	const rrr = cl.addRawResponseReader({ headers: true })

	let result: ListResponse<R> | null = null
	let lastId = null
	let rateLimit: RateLimitInfo | null = null

	const allParams: QueryParamsList = params || {}
	allParams.pageNumber = 1
	allParams.pageSize = config.api.page_max_size
	allParams.sort = ['id']
	if (!allParams.filters) allParams.filters = {}

	do {

		if (lastId) allParams.filters.id_gt = lastId

		if (rateLimit) await sleep(rateLimit.delay)

		const page = await client.list(allParams) as ListResponse<R>
		if (result === null) result = page
		else result.push(...page)

		lastId = page.last()?.id

		if (!rateLimit) try {
			const rateLimits = headerRateLimits(rrr.headers)
			rateLimit = computeRateLimits(rateLimits, resourceType, result.pageCount)
			if (rateLimit) cl.removeRawResponseReader(rrr)
		} catch (error: any) {}

	} while ( result.length < result.recordCount )


	return result

}



type UpdateResult = {
	total: number,
	processed: number,
	errors: number,
	resources: Record<string, {
		success: boolean,
		error?: ApiError,
		errorMessage?: string
	}>
}


export const updateAll = async <U extends Omit<ResourceUpdate, 'id'>>(resourceType: UpdatableResourceType, resource: U, params?: AllParams): Promise<UpdateResult> => {

	const cl = CommerceLayerUtils().sdk
	const client = cl[resourceType]
	const rrr = cl.addRawResponseReader({ headers: true })

	const result: UpdateResult = { total: 0, processed: 0, errors: 0, resources: {} }
	let lastId = null
	let rateLimit: RateLimitInfo | null = null

	const allParams: QueryParamsList = params || {}
	allParams.pageNumber = 1
	allParams.pageSize = config.api.page_max_size
	allParams.sort = ['id']
	if (!allParams.filters) allParams.filters = {}

	do {

		if (lastId) allParams.filters.id_gt = lastId

		if (rateLimit) await sleep(rateLimit.delay)
		const page = await client.list(allParams) as ListResponse<Resource>
		if (!lastId) result.total = page.recordCount

		if (!rateLimit) try {
			const rateLimits = headerRateLimits(rrr.headers)
			rateLimit = computeRateLimits(rateLimits, resourceType, (result.total + page.pageCount))
			if (rateLimit) cl.removeRawResponseReader(rrr)
		} catch (error: any) {}


		for (const item of page) {

			result.resources[item.id] = { success: false }
			const resId = result.resources[item.id]

			try {

				const updRes = {
					...resource,
					id: item.id,
					type: resourceType
				}

				if (rateLimit) await sleep(rateLimit.delay)
				await client.update(updRes)

				result.processed++
				resId.success = true

			} catch (error: any) {
				result.errors++
				if (cl.isApiError(error)) resId.error = error
				resId.errorMessage = error.message
			}

		}
		

		lastId = page.last()?.id

	} while ( (result.processed + result.errors) < result.total )


	return result

}



export const all = {
	retrieveAll,
	updateAll
}
