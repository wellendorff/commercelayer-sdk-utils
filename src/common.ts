import { type ApiError, CommerceLayerStatic } from "@commercelayer/sdk"


/** Await ms milliseconds */
export const sleep = async (ms: number): Promise<void> => {
	return new Promise(resolve => setTimeout(resolve, ms))
}


export const invalidToken = (error: Error | unknown): error is ApiError => {
	return CommerceLayerStatic.isApiError(error) && (error.status === 401) && (error.first().code === 'INVALID_TOKEN')
}
