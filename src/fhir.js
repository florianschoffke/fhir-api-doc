import utils from './utils.js';

function parseFhirCapabilityStatement(data, resourceType) {
    const { rest = [] } = JSON.parse(data);

    for (const restEntry of rest) {
        const { resource = [] } = restEntry;
        const resourceDetails = resource.find(res => res.type === resourceType);

        if (resourceDetails) {
            return {
                searchParams: resourceDetails.searchParam?.map(({ name, definition, type, documentation = 'No description', extension }) => ({
                    name,
                    definition,
                    type,
                    documentation,
                    expectation: utils.translateExpectation(
                        extension?.find(ext => ext.url === "http://hl7.org/fhir/StructureDefinition/capabilitystatement-expectation")?.valueCode
                    )
                })),
                searchInclude: resourceDetails.searchInclude,
                searchRevInclude: resourceDetails.searchRevInclude
            };
        }
    }

    console.error(`${resourceType} not found in any rest entry!`);
    return {};
}


export default {
    parseFhirCapabilityStatement
};