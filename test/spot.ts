import CommerceLayer, { CleanupCreate, ImportCreate } from "@commercelayer/sdk"
import { CommerceLayerUtils, splitCLeanup, updateAll } from "../src"



const organization = 'sdk-test-org'
const accessToken = 'eyJhbGciOiJIUzUxMiJ9.eyJvcmdhbml6YXRpb24iOnsiaWQiOiJ3UlBwRUZPRWxSIiwic2x1ZyI6InNkay10ZXN0LW9yZyIsImVudGVycHJpc2UiOmZhbHNlfSwiYXBwbGljYXRpb24iOnsiaWQiOiJWcERYV2lxa0JwIiwia2luZCI6ImludGVncmF0aW9uIiwicHVibGljIjpmYWxzZX0sInRlc3QiOnRydWUsImV4cCI6MTY5ODE0MzA3NSwicmFuZCI6MC43NTExMzc5MzgzNTkyMzY2fQ.gmougqUzvulDiVQ9qyvFT4t3wvvVBb6dct0YGgyMIorRcTpgzXkSpPKILVfAevSnaBnNdIJSifhBl-Lf1sNnEg'

const cl = CommerceLayer({ organization, accessToken })

const utils = CommerceLayerUtils(cl)


const test = async (): Promise<void> => {

  const inputs: Record<string, any>[] = []

  for (let i = 0; i < 1000; i++) {
    inputs.push({ attr: 'input_' + i })
  }

  const ic: CleanupCreate = {
    resource_type: 'prices',
  }

  const imports = await splitCLeanup(ic, { size: 30})

  console.log(imports)

}


void test()
