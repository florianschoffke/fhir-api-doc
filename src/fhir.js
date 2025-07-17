import utils from './utils.js';


const Invoke_Level = {
  system: "system",
  type: "type",
  instance: "instance"
};


function extractExtensionValues(array, targetUrl) {
  return array
    .filter(item => item.url === targetUrl)
    .map(item => {
      const result = {};
      for (const ext of item.extension) {
        if (ext.url && ext.url.startsWith("value")) continue; // skip malformed

        const valueKey = Object.keys(ext).find(k => k.startsWith("value"));
        if (valueKey) {
          result[ext.url] = ext[valueKey];
        }
      }
      return result;
    });
}

function extractExtensionValue(extensions, url) {
  if (!Array.isArray(extensions)) return null;

  const ext = extensions.find(e => e.url === url && typeof e.valueString === "string");

  return ext ? ext.valueString : null;
}


function extractExtensionCode(extensions, url) {
  if (!Array.isArray(extensions)) return null;

  const ext = extensions.find(e => e.url === url && typeof e.valueCode === "string");

  return ext ? ext.valueCode : null;
}



function extractBaseUrl(extensions) {
  return extractExtensionValue(extensions, "https://gematik.de/fhir/ti/StructureDefinition/extension-base-url");
}


function extractHttpMethods(extensions) {
  const _default = ["POST"];
  const _url = "https://gematik.de/fhir/ti/StructureDefinition/extension-http-method";

  if (!Array.isArray(extensions)) {
    return _default;
  }

  const methods = extensions
    .filter(ext => ext.url === _url && typeof ext.valueCode === "string")
    .map(ext => ext.valueCode.toUpperCase());

  return methods.length > 0 ? methods : _default;
}


function extractHeaderValues(extensions) {
  const targetUrlHeaders = "https://gematik.de/fhir/ti/StructureDefinition/extension-http-header";
  return extractExtensionValues(extensions, targetUrlHeaders);
}


function extractResponseInfoValues(extensions) {
  const targetUrlResponses = "https://gematik.de/fhir/ti/StructureDefinition/extension-http-response-info";
  return extractExtensionValues(extensions, targetUrlResponses);
}



function parseGlobalServerInfo(data) {
    const capabilityStatement = utils.toJson(data);
    const { extension: extensions = [] } = capabilityStatement;
    const globalHeaders = extractHeaderValues(extensions);
    const globalResponses = extractResponseInfoValues(extensions);

    return {
        headerParams: [...globalHeaders],
        responseInfos: [...globalResponses],
        formats: capabilityStatement.format,
        baseUrl: extractBaseUrl(extensions)

    };
}


function parseFhirCapabilityStatement(data, resourceType, interactionCode = "search-type") {
    const capabilityStatement = utils.toJson(data);

    const { extension: extensions = [] } = capabilityStatement;
    const globalHeaders = extractHeaderValues(extensions);
    const globalResponses = extractResponseInfoValues(extensions);

    const { rest: rest = [] } = capabilityStatement;
    for (const restEntry of rest) {
        const { resource = [] } = restEntry;
        const resourceDetails = resource.find(res => res.type === resourceType);

        if (!resourceDetails) continue;

        const interaction = (resourceDetails.interaction || []).find(
            int => int.code === interactionCode
        );

        const localHeaders = interaction?.extension
            ? extractHeaderValues(interaction.extension)
            : [];

        const localResponses = interaction?.extension
            ? extractResponseInfoValues(interaction.extension)
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
            headerParams: [...localHeaders, ...globalHeaders],
            responseInfos: [...localResponses, ...globalResponses],
            formats: capabilityStatement.format,
            conditionalUpdate: resourceDetails.conditionalUpdate,
            baseUrl: extractBaseUrl(extensions)

        };
    }

    console.error(`${resourceType} not found in any rest entry!`);
    return {};
}


function getOperation(operationDefinition, invokeLevel, restEntry, resourceType=null) {
  if (invokeLevel === Invoke_Level.system) {
    const { operation = [] } = restEntry;
    return operation.find(op => op.definition === operationDefinition.url);
  } else if(invokeLevel === Invoke_Level.type | invokeLevel === Invoke_Level.instance) {
    if(!resourceType){
      console.error(`You need a resourceType when invoke level is "${invokeLevel}"`);
      return null;
    }
    const { resource = [] } = restEntry;
    const resourceDetails = resource.find(res => res.type === resourceType);
    if (!resourceDetails) {
      return null;
    }
    const { operation = [] } = resourceDetails;
    return operation.find(op => op.definition === operationDefinition.url);
  }
  return null;
}


function parseFhirOperationCapabilityStatement(data, opData, invokeLevel, resourceType) {
    const capabilityStatement = utils.toJson(data);
    const operationDefinition = utils.toJson(opData);
    const { extension: extensions = [] } = capabilityStatement;
    const globalHeaders = extractHeaderValues(extensions);
    const globalResponses = extractResponseInfoValues(extensions);
    const { rest: rest = [] } = capabilityStatement;
    for (const restEntry of rest) {
      let localHeaders = [];
      let localResponses = [];
      const searchParams = (operationDefinition?.parameter || [])
        .filter(param => param.use === "in")
        .map(({ name, type, documentation = '-' }) => ({
          name,
          type,
          documentation
      }));

      const operation = getOperation(operationDefinition, invokeLevel, restEntry, resourceType)
      localHeaders = operation?.extension
          ? extractHeaderValues(operation.extension)
          : [];

      localResponses = operation?.extension
          ? extractResponseInfoValues(operation.extension)
          : [];
      let methods = extractHttpMethods(operationDefinition.extension)
      return {
          baseUrl: extractBaseUrl(extensions),
          code: `${operationDefinition.code}`,
          formats: capabilityStatement.format,
          headerParams: [...localHeaders, ...globalHeaders],
          responseInfos: [...localResponses, ...globalResponses],
          searchParams: searchParams,
          methods: methods
      };
    }
    return {
      methods:[]
    };
}

export default {
    parseFhirCapabilityStatement,
    parseFhirOperationCapabilityStatement,
    parseGlobalServerInfo,
    Invoke_Level
};