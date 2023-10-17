import type { Cleanup, CleanupCreate } from "@commercelayer/sdk"
import type { Task, TemplateTask } from "../batch"
import { type ResourceJobOutput, splitOutputJob, jobsToBatchTasks } from "../jobs"



export type CleanupResult = Cleanup



export const splitCLeanup = async (clp: CleanupCreate, clpSize?: number): Promise<CleanupCreate[]> => {
	return splitOutputJob<CleanupCreate>(clp, 'cleanups', clpSize)
}


export const cleanupsToBatchTasks = (cleanups: CleanupCreate[], baseTask?: TemplateTask): Array<Task & { operation: 'create' }> => {
	return jobsToBatchTasks(cleanups as ResourceJobOutput[], 'cleanups',  baseTask)
}


/*
export const executeCleanups = async (cleanups: CleanupCreate[]): Promise<CleanupResult[]> => {
	return executeOutputJobs<Cleanup>(cleanups, 'cleanups')
}
*/



export const cleanups = {
	split: splitCLeanup,
	toBatchTasks: cleanupsToBatchTasks,
}