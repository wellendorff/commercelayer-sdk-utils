
import type { SdkError } from '@commercelayer/sdk'
import { currentAccessToken, initClient, initialize, cl } from '../test/common'
import { executeBatch } from '../src'
import type { Batch, InvalidTokenError, Task, TaskResult } from '../src'
import type { Resource } from '@commercelayer/sdk/lib/cjs/resource'



beforeAll(async () => {
	await initialize()
})

afterEach(() => {
	jest.resetAllMocks()
})



describe('sdk-utils.batch suite', () => {

	it('batch.no_errors', async () => {

		const tasksNumber = 3
		const tasks: Task[] = []

		for (let i = 1; i <= tasksNumber; i++) {
			const email = `${String(Date.now()+i)}@batch-test.org`
			tasks.push({
				resourceType: 'customers',
				operation: 'create',
				resource: { email }
			})
		}

		await executeBatch({ tasks })

		for (const t of tasks) {
			expect(t.executed).toBeTruthy()
			expect(t.onSuccess?.result).toBeDefined()
			expect(((t.onSuccess?.result) as Resource).id).toBeDefined()
		}

	})


	it('batch.error.halt', async () => {

		const tasksNumber = 3
		const errorTask = 2
		const tasks: Task[] = []

		for (let i = 1; i <= tasksNumber; i++) {
			const email = (i === errorTask)? 'fake-email' : `${String(Date.now()+i)}@batch-test.org`
			tasks.push({
				resourceType: 'customers',
				operation: 'create',
				resource: { email },
				onFailure: {
					haltOnError: (i === errorTask)
				}
			})
		}

		await executeBatch({ tasks }).catch(err => {})

		let index = 0
		for (const t of tasks) {
			index++
			if (index < errorTask) {
				expect(t.executed).toBeTruthy()
				expect(t.onSuccess?.result).toBeDefined()
				expect(((t.onSuccess?.result) as Resource).id).toBeDefined()
			} else if (index === errorTask) {
				expect(t.executed).toBeTruthy()
				expect(t.onFailure?.error).toBeDefined()
			} else if (index > errorTask) {
				expect(t.executed).toBeFalsy()
				expect(t.onSuccess?.result).toBeUndefined()
				expect(t.onFailure?.error).toBeUndefined()
			}
		}

	})


	
	it('batch.error.no_halt', async () => {

		const tasksNumber = 3
		const errorTask = 2
		const tasks: Task[] = []

		for (let i = 1; i <= tasksNumber; i++) {
			const email = (i === errorTask)? 'fake-email' : `${String(Date.now()+i)}@batch-test.org`
			tasks.push({
				resourceType: 'customers',
				operation: 'create',
				resource: { email }
			})
		}

		await executeBatch({ tasks }).catch(err => {})

		let index = 0
		for (const t of tasks) {
			index++
			if (index < errorTask) {
				expect(t.executed).toBeTruthy()
				expect(t.onSuccess?.result).toBeDefined()
				expect(((t.onSuccess?.result) as Resource).id).toBeDefined()
			} else if (index === errorTask) {
				expect(t.executed).toBeTruthy()
				expect(t.onFailure?.error).toBeDefined()
			} else if (index > errorTask) {
				expect(t.executed).toBeTruthy()
				expect(t.onSuccess?.result).toBeDefined()
				expect(((t.onSuccess?.result) as Resource).id).toBeDefined()
			}
		}

	})


	it('batch.refresh_token', async () => {

		const tasksNumber = 2
		const tasks: Task[] = []

		function tokenRefresh(error: InvalidTokenError, task: Task): string {
			initClient()
			return currentAccessToken
		} 

		cl.config({ accessToken: 'fake-token'})

		for (let i = 1; i <= tasksNumber; i++) {
			const email = `${String(Date.now()+i)}@batch-test.org`
			const task: Task = {
				resourceType: 'customers',
				operation: 'create',
				resource: { email },
			}
			tasks.push(task)
		}

		const b: Batch = { tasks, options: { refreshToken: tokenRefresh} }
		if (b.options) jest.spyOn(b.options, 'refreshToken')

		await executeBatch(b).catch(err => {})

		for (const t of tasks) {
			expect(t.executed).toBeTruthy()
			expect(t.onSuccess?.result).toBeDefined()
			expect(((t.onSuccess?.result) as Resource).id).toBeDefined()
		}

		expect(b.options?.refreshToken).toBeCalled()

		jest.resetAllMocks()

	})


	it('batch.error.callback', async () => {

		const tasksNumber = 3
		const errorTask = 2
		const tasks: Task[] = []

		function errorCallback(error: SdkError, task: Task): boolean {
			return true
		} 


		for (let i = 1; i <= tasksNumber; i++) {
			const email = (i === errorTask)? 'fake-email' : `${String(Date.now()+i)}@batch-test.org`
			const task: Task = {
				resourceType: 'customers',
				operation: 'create',
				resource: { email },
				onFailure: { errorHandler: errorCallback }
			}
			tasks.push(task)
			if (task.onFailure) jest.spyOn(task.onFailure, 'errorHandler')
		}

		await executeBatch({ tasks }).catch(err => {})

		let index = 0
		for (const t of tasks) {
			index++
			if (index < errorTask) {
				expect(t.executed).toBeTruthy()
				expect(t.onSuccess?.result).toBeDefined()
				expect(((t.onSuccess?.result) as Resource).id).toBeDefined()
			} else if (index === errorTask) {
				expect(t.executed).toBeTruthy()
				expect(t.onFailure?.error).toBeDefined()
				expect(t.onFailure?.errorHandler).toBeCalled()
			} else if (index > errorTask) {
				expect(t.executed).toBeFalsy
				expect(t.onSuccess?.result).toBeUndefined()
			}
		}

		jest.resetAllMocks()

	})


	it('batch.success.callback', async () => {

		const tasksNumber = 3
		const errorTask = 2
		const tasks: Task[] = []

		function successCallback(output: TaskResult, task: Task): void {
			
		} 


		for (let i = 1; i <= tasksNumber; i++) {
			const email = `${String(Date.now()+i)}@batch-test.org`
			const task: Task = {
				resourceType: 'customers',
				operation: 'create',
				resource: { email },
				onSuccess: { callback: successCallback }
			}
			tasks.push(task)
			if (task.onSuccess) jest.spyOn(task.onSuccess, 'callback')
		}

		await executeBatch({ tasks }).catch(err => {})

		for (const t of tasks) {
			expect(t.executed).toBeTruthy()
			expect(t.onSuccess?.result).toBeDefined()
			expect(((t.onSuccess?.result) as Resource).id).toBeDefined()
			expect(t.onSuccess?.callback).toBeCalled()
		}

		jest.resetAllMocks()

	})

})
