import type { HeadersObj } from "@commercelayer/sdk"
import type { Task } from "./batch"


export type RateLimitHeader = {
	count?: number,
	period?: number,
	interval: number,
	limit: number,
	remaining: number
}


export type RateLimitInfo = {
	limit: number
	interval: number
	delay: number,
	requests?: number
}


export const headerRateLimits = (headers?: HeadersObj): RateLimitHeader => {
	if (!headers) throw new Error('Unable to find rate limit headers in response')
	return {
		count: Number(headers["x-ratelimit-count"]),
		period: Number(headers["x-ratelimit-period"]),
		interval: Number(headers["x-ratelimit-interval"]),
		limit: Number(headers["x-ratelimit-limit"]),
		remaining: Number(headers["x-ratelimit-remaining"])
	}
}


export const computeRateLimits = (rateLimit: RateLimitHeader, resourceType: string | Task, allRequests: number | Task[]): RateLimitInfo => {

	const BURST_INTERVAL = 10 * 1000
	const BURST_MAX_REQUESTS = 25

	const resType = (typeof resourceType === 'string')? resourceType : resourceType.resourceType
	// const task = (typeof currentTask === 'number')? allTasks[currentTask] : currentTask

	const rli: RateLimitInfo = {
		limit: rateLimit.limit,
		interval: rateLimit.interval,
		delay: 0
	}

	if (rateLimit) {
		const totalRequests = (typeof allRequests === 'number')? allRequests : allRequests.length
		rli.requests = totalRequests
		if (totalRequests >= rateLimit.limit) rli.delay = Math.ceil((rateLimit.interval * 1000) / rateLimit.limit)
		else {
			const resourceRequests = (typeof allRequests === 'number')? totalRequests : allRequests.filter(t => (t.resourceType === resType)).length
			if (resourceRequests >= BURST_MAX_REQUESTS) rli.delay = Math.ceil(BURST_INTERVAL / BURST_MAX_REQUESTS)
		}
	}

	return rli

}
