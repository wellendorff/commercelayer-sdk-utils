import { CommerceLayerStatic } from "@commercelayer/sdk"
import type { Resource, ResourceType } from "@commercelayer/sdk/lib/cjs/resource"
import type { DocWithData, Included, ResourceIdentifierObject, ResourceObject } from 'jsonapi-typescript'
import crypto from 'crypto'
import { config } from "../config"



const checkPayload = (payload: string): DocWithData => {

	let resource

	// Check JSON
	try { resource = JSON.parse(payload) }
	catch (error: any) { throw new Error(`Error parsing payload [${error.message}]`) }

	// Check resource type
	if (!CommerceLayerStatic.resources().includes(resource.data?.type as string)) throw new Error(`Invalid resource type [${resource.data?.type}]`)

	return resource

}


export const denormalizePayload = <R extends Resource>(payload: string): R | R[] => {

	let denormalized

	const resource = checkPayload(payload)

	if (resource.links) delete resource.links

	const data = resource.data
	const included = resource.included

	if (!data) denormalized = data
	else {
		if (Array.isArray(data)) denormalized = data.map(res => denormalizeResource<R>(res, included))
		else denormalized = denormalizeResource<R>(data, included)
	}

	return denormalized

}


const findIncluded = (rel: ResourceIdentifierObject, included: Included = []): ResourceObject | undefined => {
	const inc = included.find(inc => {
		return (rel.id === inc.id) && (rel.type === inc.type)
	})
	return inc || rel
}


const denormalizeResource = <T extends ResourceType>(res: any, included?: Included): T => {

	if (!res) return res

	const resource = {
		id: res.id,
		type: res.type,
		...res.attributes,
	}

	if (res.relationships) Object.keys(res.relationships as object).forEach(key => {
		const rel: ResourceIdentifierObject = res.relationships[key].data
		if (rel) {
			if (Array.isArray(rel)) resource[key] = rel.map((r: ResourceIdentifierObject) => denormalizeResource<ResourceType>(findIncluded(r, included), included))
			else resource[key] = denormalizeResource<ResourceType>(findIncluded(rel, included), included)
		} else if (rel === null) resource[key] = null
	})


	return resource

}



const generateHMAC = (payload: string, sharedSecret: string): string => {
	const { algorithm, digest } = config.webhooks.signature
	return crypto.createHmac(algorithm, sharedSecret).update(payload).digest(digest)
}


type CheckStatus = {
	ok: boolean,
	topic?: string,
	message?: string
}

/**
 * 
 * @param body the webhook body
 * @param headers all headers map or value of the signature header
 * @param secret the shared secret string
 * @returns 
 */
export const checkSignature = (body: string, headers: Record<string, string> | string, secret: string): CheckStatus => {

	const status: CheckStatus = {
		ok: false
	}

	try {

		const topic = (typeof headers === 'string')? undefined : headers[config.webhooks.topic]
		const signature =(typeof headers === 'string')? headers : headers[config.webhooks.signature.header]

		if (!secret) return { ...status, message: 'Missing shared secret'}
		if (!signature) return { ...status, message: 'Missing webhook signature'}

		const hash = generateHMAC(body, secret)

		status.topic = topic

		if (signature === hash) {
			status.ok = true
			status.message = 'Signature successfully checked'
		}
		else status.message = 'Payload signature verification failed'

	}
	catch (err) {
		status.ok = false
		status.message = (err as Error).message
	}


	return status

}



export const webhooks = {
	denormalizePayload,
	checkSignature
}
