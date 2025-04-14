
function parseFhirCapabilityStatement(data, resourceType) {
    const { rest: [{ resource = [] } = {}] = [] } = JSON.parse(data);
    const resourceDetails = resource.find(res => res.type === resourceType);
    if (!resourceDetails) {
        console.error(`${resourceType} not found!`);
        return {};
    }
    const translateExpectation = (expectation) => ({
        "SHALL": window.gemIGApiDocLabels.Expectation_SHALL,
        'SHALL-NOT': window.gemIGApiDocLabels.Expectation_SHOULD,
        'SHOULD': window.gemIGApiDocLabels.Expectation_SHOULD,
        'SHOULD-NOT': window.gemIGApiDocLabels.Expectation_SHOULD_NOT,
        'MAY': window.gemIGApiDocLabels.Expectation_MAY
    }[expectation] || expectation);

    return {
        searchParams: resourceDetails.searchParam?.map(({ name, definition, type, documentation = 'No description', extension }) => ({
            name,
            definition,
            type,
            documentation,
            expectation: translateExpectation(extension?.find(ext => ext.url === "http://hl7.org/fhir/StructureDefinition/capabilitystatement-expectation")?.valueCode)
        })),
        searchInclude: resourceDetails.searchInclude,
        searchRevInclude: resourceDetails.searchRevInclude
    };
}


export default {
    parseFhirCapabilityStatement
};