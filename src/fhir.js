import utils from './utils.js';

const Invoke_Level = {
    system: "system",
    type: "type",
    instance: "instance"
};

function extractExtensionValues(array, targetUrl) {

    if (!Array.isArray(array)) {
        return [];
    }

    return array
        .filter(item => item.url === targetUrl)
        .map(item => {
            const result = {};
            if(!Array.isArray(item.extension)) return result;

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

    const ext = extensions.find(e => e && e.url === url && typeof e.valueString === "string" && 
        e.valueString.length > 0);

    return ext ? ext.valueString : null;
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
    const capabilityStatement = utils.toJson(data)  ?? {};
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

const TI_URL = 'https://gematik.de/fhir/ti/StructureDefinition/';
const CONDITIONAL_CODES = ['conditional-create', 'conditional-read', 'conditional-update', 'conditional-delete'];
const RESOURCE_CODES = ['read', 'vread', 'update', 'patch', 'delete', 'history-instance', 'history-type', 'create', 'search-type', ...CONDITIONAL_CODES];

function conditionalEnabled(resource, code) {
    switch (code) {
    case 'conditional-create': return resource.conditionalCreate === true;
    case 'conditional-read': return ['modified-since', 'not-match', 'full-support'].includes(resource.conditionalRead);
    case 'conditional-update': return resource.conditionalUpdate === true;
    case 'conditional-delete': return ['single', 'multiple'].includes(resource.conditionalDelete);
    default: return false;
    }
}

function resourceInteractionExtensions(resource, code, url) {
    return (resource.extension || []).filter(ext => ext.url === url).filter(ext => {
        const selectors = (ext.extension || []).filter(item => item.url === 'interaction');
        if (selectors.length !== 1 || !RESOURCE_CODES.includes(selectors[0].valueCode)) {
            throw new Error(`Resource HTTP extension requires exactly one supported interaction selector: ${url}`);
        }
        return selectors[0].valueCode === code;
    });
}

function conditionalHeaders(resource, code) {
    if (code === 'conditional-create') return [{ name: 'If-None-Exist', type: 'string', description: 'Search criteria', required: true }];
    if (code !== 'conditional-read') return [];
    const headers = [];
    if (['modified-since', 'full-support'].includes(resource.conditionalRead)) headers.push({ name: 'If-Modified-Since', type: 'string', description: 'Last modification date', required: true });
    if (['not-match', 'full-support'].includes(resource.conditionalRead)) headers.push({ name: 'If-None-Match', type: 'string', description: 'ETag', required: true });
    return headers;
}

function mergeHeaders(base, added) {
    const result = [...base];
    for (const header of added) {
        const index = result.findIndex(item => item.name === header.name && (item.location || 'header') === (header.location || 'header'));
        if (index < 0) result.push(header);
        else result[index] = header;
    }
    return result;
}

function mergeResponses(base, added) {
    const result = [...base];
    for (const response of added) {
        const index = result.findIndex(item => String(item.statusCode) === String(response.statusCode));
        if (index < 0) result.push(response);
        else result[index] = { ...result[index], ...response };
    }
    return result;
}

function getRelatedSearchParams(resourceDetails, interactionCode = 'search-type') {
    const hasSearchTypeInteraction = (resourceDetails.interaction || []).find(
        int => int.code === "search-type"
    );

    if (interactionCode === 'search-type' && !hasSearchTypeInteraction) {
        return undefined;
    }

    const searchParams = (resourceDetails.searchParam || []).filter(param => {
        if (['conditional-update', 'conditional-delete'].includes(interactionCode)) return true;
        const assignments = (param.extension || []).filter(ext => ext.url === `${TI_URL}search-parameter-interaction`);
        return assignments.length === 0 ? interactionCode === 'search-type' : assignments.some(ext => ext.valueCode === interactionCode);
    }).map(({ name, definition, type, documentation = 'No description', extension }) => ({
        name,
        definition,
        type,
        documentation,
        expectation: utils.translateExpectation(
            extension?.find(ext => ext.url === "http://hl7.org/fhir/StructureDefinition/capabilitystatement-expectation")?.valueCode
        )
    }));

    return searchParams.length > 0 ? searchParams : undefined;
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

        const conditional = CONDITIONAL_CODES.includes(interactionCode);
        const enabled = conditional ? conditionalEnabled(resourceDetails, interactionCode) : true;
        const resourceHeaders = extractHeaderValues(resourceInteractionExtensions(resourceDetails, interactionCode, `${TI_URL}extension-http-header`));
        const resourceResponses = extractResponseInfoValues(resourceInteractionExtensions(resourceDetails, interactionCode, `${TI_URL}extension-http-response-info`));
        const headers = mergeHeaders([...localHeaders, ...globalHeaders, ...conditionalHeaders(resourceDetails, interactionCode)], resourceHeaders);
        const responses = mergeResponses([...localResponses, ...globalResponses, ...(interactionCode === 'conditional-read' ? [{ statusCode: '304', description: 'Not modified' }] : [])], resourceResponses);
        const searchParams = enabled && (!conditional || ['conditional-update', 'conditional-delete'].includes(interactionCode))
            ? getRelatedSearchParams(resourceDetails, interactionCode) : undefined;
        if (enabled && ['conditional-update', 'conditional-delete'].includes(interactionCode) && !resourceDetails.searchParam?.length) console.warn(`${interactionCode} on ${resourceType} has no search parameters`);
        const profiles = [
            ...(resourceDetails.profile ? [resourceDetails.profile] : []),
            ...(Array.isArray(resourceDetails.supportedProfile) ? resourceDetails.supportedProfile : [])
        ];

        return {
            ...(conditional ? { enabled } : {}),
            searchParams,
            searchInclude: resourceDetails.searchInclude,
            searchRevInclude: resourceDetails.searchRevInclude,
            ...(profiles.length > 0 ? { profiles } : {}),
            headerParams: headers,
            responseInfos: responses,
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
        return operation.find(op => op.definition === operationDefinition?.url);
    } else if(invokeLevel === Invoke_Level.type || invokeLevel === Invoke_Level.instance) {
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

    if (!Array.isArray(rest) || rest.length === 0) {
        return {
            methods:[]
        };
    }

    let operation;
    for (const restEntry of rest) {
        operation = getOperation(operationDefinition, invokeLevel, restEntry, resourceType);
        if (operation) {
            break;
        }
    }

    const searchParams = (operationDefinition?.parameter || [])
        .filter(param => param.use === "in")
        .filter(param => {
            const locations = (param.extension || []).filter(ext => ext.url === `${TI_URL}operation-parameter-location`);
            if (locations.some(ext => ext.valueCode !== 'query')) throw new Error(`Unsupported operation parameter location: ${param.name}`);
            return true;
        })
        .map(({ name, type, documentation = '-', min, extension }) => {
            const queryLocation = (extension || []).some(ext => ext.url === `${TI_URL}operation-parameter-location`);
            return {
                name,
                type,
                documentation,
                ...(queryLocation ? { required: min > 0, queryLocation: true } : {})
            };
        });

    const localHeaders = operation?.extension
        ? extractHeaderValues(operation.extension)
        : [];

    const localResponses = operation?.extension
        ? extractResponseInfoValues(operation.extension)
        : [];

    const methods = extractHttpMethods(operationDefinition.extension)

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

export default {
    extractExtensionValues,
    extractExtensionValue,
    extractBaseUrl,
    extractHttpMethods,
    extractHeaderValues,
    extractResponseInfoValues,
    parseGlobalServerInfo,
    getRelatedSearchParams,
    parseFhirCapabilityStatement,
    getOperation,
    parseFhirOperationCapabilityStatement,
    Invoke_Level
};