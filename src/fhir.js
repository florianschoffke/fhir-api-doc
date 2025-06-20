import utils from './utils.js';


function extractExtensionValues(array, targetUrl) {
//   const targetUrl = "https://gematik.de/fhir/ti/StructureDefinition/extension-http-header";

  return array
    .filter(item => item.url === targetUrl)
    .map(item => {
      const header = {};
      for (const ext of item.extension) {
        if (ext.url && ext.url.startsWith("value")) continue; // skip malformed

        const valueKey = Object.keys(ext).find(k => k.startsWith("value"));
        if (valueKey) {
          header[ext.url] = ext[valueKey];
        }
      }
      return header;
    });
}

function extractBaseUrl(extensions, baseUrlExtension = "https://gematik.de/fhir/ti/StructureDefinition/extension-base-url") {
  if (!Array.isArray(extensions)) return null;

  const ext = extensions.find(e => e.url === baseUrlExtension && typeof e.valueString === "string");

  return ext ? ext.valueString : null;
}



function parseFhirCapabilityStatement(data, resourceType, interactionCode = "search-type") {
    const targetUrlHeaders = "https://gematik.de/fhir/ti/StructureDefinition/extension-http-header";
    const targetUrlResponses = "https://gematik.de/fhir/ti/StructureDefinition/extension-http-response-info";
    const capabilityStatement = JSON.parse(data);
    const { rest: rest = [] } = capabilityStatement;
    const { extension: extensions = [] } = capabilityStatement;

    const globalHeaders = extractExtensionValues(extensions, targetUrlHeaders);
    const globalResponses = extractExtensionValues(extensions, targetUrlResponses);

    for (const restEntry of rest) {
        const { resource = [] } = restEntry;
        const resourceDetails = resource.find(res => res.type === resourceType);

        if (!resourceDetails) continue;

        const interaction = (resourceDetails.interaction || []).find(
            int => int.code === interactionCode
        );

        const localHeaders = interaction?.extension
            ? extractExtensionValues(interaction.extension, targetUrlHeaders)
            : [];

        const localResponses = interaction?.extension
            ? extractExtensionValues(interaction.extension, targetUrlResponses)
            : [];

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
            searchRevInclude: resourceDetails.searchRevInclude,
            headerParams: [...globalHeaders, ...localHeaders],
            responseInfos: [...globalResponses, ...localResponses],
            formats: capabilityStatement.format,
            conditionalUpdate: resourceDetails.conditionalUpdate,
            baseUrl: extractBaseUrl(extensions)

        };
    }

    console.error(`${resourceType} not found in any rest entry!`);
    return {};
}


export default {
    parseFhirCapabilityStatement
};