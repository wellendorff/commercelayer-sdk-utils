import type { Import, ImportCreate } from "@commercelayer/sdk"
import type { Task, TemplateTask } from "../batch"
import { splitInputJob, jobsToBatchTasks, type JobOptions } from "../jobs"



export type ImportResult = Import



export const splitImport = (imp: ImportCreate, options?: JobOptions): ImportCreate[] => {
	return splitInputJob<ImportCreate>(imp, 'imports', options)
}


export const importsToBatchTasks = (imports: ImportCreate[], baseTask?: TemplateTask): Array<Task & { operation: 'create' }> => {
	return jobsToBatchTasks(imports, 'imports',  baseTask)
}


/*
export const executeExports = async (exports: ExportCreate[]): Promise<ExportResult[]> => {
	return executeOutputJobs<Export>(exports, 'exports')
}
*/



export const imports = {
	split: splitImport,
	toBatchTasks: importsToBatchTasks,
}
