import type { Export, ExportCreate } from "@commercelayer/sdk"
import type { Task, TemplateTask } from "../batch"
import { type ResourceJobOutput, splitOutputJob, jobsToBatchTasks, type JobOptions } from "../jobs"



export type ExportResult = Export



export const splitExport = async (exp: ExportCreate, options?: JobOptions): Promise<ExportCreate[]> => {
	return splitOutputJob<ExportCreate>(exp, 'exports', options)
}


export const exportsToBatchTasks = (exports: ExportCreate[], baseTask?: TemplateTask): Array<Task & { operation: 'create' }> => {
	return jobsToBatchTasks(exports as ResourceJobOutput[], 'exports',  baseTask)
}


/*
export const executeExports = async (exports: ExportCreate[]): Promise<ExportResult[]> => {
	return executeOutputJobs<Export>(exports, 'exports')
}
*/



export const exportz = {
	split: splitExport,
	toBatchTasks: exportsToBatchTasks,
}
