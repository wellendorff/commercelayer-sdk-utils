import { CommerceLayerStatic } from "@commercelayer/sdk"
import type { Resource, ResourceType } from "@commercelayer/sdk/lib/cjs/resource"
import type { DocWithData, Included, ResourceIdentifierObject, ResourceObject } from 'jsonapi-typescript'



const checkPayload = (payload: string): DocWithData => {

	let resource

	// Check JSON
	try { resource = JSON.parse(payload) }
	catch (error: any) { throw new Error(`Error parsing payload [${error.message}]`) }

	// Check resource type
	if (!CommerceLayerStatic.resources().includes(resource.data?.type)) throw new Error(`Invalid resource type [${resource.data?.type}]`)

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

	if (res.relationships) Object.keys(res.relationships).forEach(key => {
		const rel = res.relationships[key].data
		if (rel) {
			if (Array.isArray(rel)) resource[key] = rel.map(r => denormalizeResource<ResourceType>(findIncluded(r, included), included))
			else resource[key] = denormalizeResource<ResourceType>(findIncluded(rel, included), included)
		} else if (rel === null) resource[key] = null
	})


	return resource

}



export const webhooks = {
	denormalizePayload
}
