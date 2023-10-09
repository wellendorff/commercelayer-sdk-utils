import type { ExportCreate } from "@commercelayer/sdk"
import CommerceLayerUtils from "./init"
import { config } from "./config"
import type { ListableResourceType } from "@commercelayer/sdk/lib/cjs/api"
import type { QueryFilter } from "@commercelayer/sdk/lib/cjs/query"
import type { Task, TemplateTask } from "./batch"



export const prepareExports = async (exp: ExportCreate, expSize?: number): Promise<ExportCreate[]> => {

	const cl = CommerceLayerUtils().sdk
	const resSdk = cl[exp.resource_type as ListableResourceType]
	const exportMaxSize = expSize? Math.min(Math.max(1, expSize), config.exports.max_size) : config.exports.max_size

	const totRecords = await resSdk.count({ filters: exp.filters as QueryFilter, pageSize: 1, pageNumber: 1 })

	const totExports = Math.ceil(totRecords / exportMaxSize)


	const exports: ExportCreate[] = []
	let startId = null
	let stopId = null
	let expPage = 0


	for (let curExp = 0; curExp < totExports; curExp++) {

		const expCreate: ExportCreate = {
			...exp,
			filters: { ...exp.filters },
			metadata: { ...exp.metadata }
		}
		if (!expCreate.filters) expCreate.filters = {}

		const curExpRecords = Math.min(exportMaxSize, totRecords - (exportMaxSize * curExp))
		const curExpPages = Math.ceil(curExpRecords / config.api.page_max_size)
		expPage += curExpPages

		const curExpLastPage = await resSdk.list({ filters: exp.filters as QueryFilter, pageSize: config.api.page_max_size, pageNumber: expPage, sort: { id: 'asc' } })

		stopId = curExpLastPage.last()?.id

		if (startId) expCreate.filters.id_gt = startId
		if ((curExp + 1 < totExports)) expCreate.filters.id_lteq = stopId

		if (!expCreate.metadata) expCreate.metadata = {}
		expCreate.metadata.export_number = `${curExp + 1}/${totExports}`

		exports.push(expCreate)

		startId = stopId

	}

	return exports

}


export const exportsToBatchTasks = (exports: ExportCreate[], baseTask?: TemplateTask): Array<Task & { operation: 'create' }> => {

	return exports.map(exp => {

		const task: Task = {
			operation: 'create',
			resourceType: 'exports',
			resource: { ...exp }
		}

		if (baseTask) {
			task.onFailure = baseTask.onFailure
			task.onSuccess = baseTask.onSuccess
			task.params = baseTask.params
			task.options = baseTask.options
		}

		return task

	})

}



export const exportz = {
	prepareExports,
	exportsToBatchTasks
}
