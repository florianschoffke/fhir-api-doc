import fhir from './fhir.js';
import utils from './utils.js';
import gematikLabels from './labels.js'

import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';

import '../css/ig.apidoc.gematik.css';


hljs.registerLanguage('xml', xml);
hljs.registerLanguage('json', json);


const ApiType = {
    FHIRResource: "FHIRResource",
    FHIROperation: "FHIROperation",
    CUSTOM: "Custom"
};

document.addEventListener("DOMContentLoaded", () => {
    renderCapabilityStatementApiDoc();
});


function parseExampleDivs(container) {
    if(!container) {
        return null;
    }
    const exampleDivs = Array.from(container.querySelectorAll('div[data-name][data-type]'));

    return exampleDivs.map(div => {
        const name = div.getAttribute('data-name');
        const type = div.getAttribute('data-type');
        const url = div.getAttribute('data-url');
        const render = div.getAttribute('data-render');

        return {
            name,
            type,
            render,
            ...(url
                ? { url }
                : { data: div.innerHTML.trim() }
            )
        };
    });
}


function parseValueDivs(container) {
    if (!container) {
        return null;
    }
    const divs = Array.from(container.querySelectorAll('div[data-value]'));
    return divs.map(div => div.getAttribute('data-value'));
}


function parseParams(container) {
    if (!container) {
        return [];
    }
    // const divs = Array.from(container.querySelectorAll('div[data-name][data-type]'));
    const divs = Array.from(container.children);

    return divs.map(div => {
        const name = div.getAttribute('data-name');
        const type = div.getAttribute('data-type');
        const documentation = div.innerHTML;
        const description = div.innerHTML;
        const expectation = "";

        return {
            name,
            type,
            documentation,
            description,
            expectation
        };
    });
}

function parseResponseInfos(container) {
    if (!container) {
        return [];
    }
    const divs = Array.from(container.children);

    return divs.map(div => {
        const statusCode = div.getAttribute('data-code');
        const errorCode = div.getAttribute('data-error-code');
        const description = div.innerHTML;
        const responseType = div.getAttribute('data-response-type');

        return {
            statusCode,
            errorCode,
            description,
            responseType
        };
    });
}



function renderCapabilityStatementApiDoc() {
    const capDivs = document.querySelectorAll('.gematik-apidoc, .gematik-api');
    capDivs.forEach(div => {
        let _apiType = div.getAttribute('data-api-type');
        if(!_apiType) {
            _apiType = ApiType.CUSTOM;
        }
        const resourceType = div.getAttribute('data-api-fhir-resource-type');
        const interaction = div.getAttribute('data-api-fhir-interaction');
        const operationId = div.getAttribute('data-api-operation-id');
        const urlPath = div.getAttribute('data-api-url-path');
        const invokeLevel = div.getAttribute('data-api-fhir-invoke-level');
        const httpMethod = div.getAttribute('data-api-method');

        const descriptionDiv = div.querySelector('#description, #Description');
        const description = descriptionDiv?.innerHTML?.trim() ?? '';

        let cap = null;
        let capUrl = null;
        const capabilityStatementContainer = div.querySelector('#CapabilityStatement, #Capability-Statement, #capability-statement');
        if (capabilityStatementContainer) {
            capUrl = capabilityStatementContainer.getAttribute('data-url');
            if(utils.isJson(capabilityStatementContainer.textContent)) {
                cap = capabilityStatementContainer.textContent;
            }
        }

        let operationDefinition = null;
        let operationDefinitionUrl = null;
        const operationDefinitionContainer = div.querySelector('#OperationDefinition, #Operation-Definition, #operation-definition');
        if (operationDefinitionContainer) {
            operationDefinitionUrl = operationDefinitionContainer.getAttribute('data-url');
            if(utils.isJson(operationDefinitionContainer.textContent)) {
                operationDefinition = operationDefinitionContainer.textContent;
            }
        }

        const formats = parseValueDivs(div.querySelector('#formats, #Formats'));
        const responseExamples = parseExampleDivs(div.querySelector('#response-examples, #Response-Examples, #ResponseExamples'));
        const requestExamples = parseExampleDivs(div.querySelector('#request-examples, #Request-Examples, #RequestExamples'));
        const headerParams = parseParams(div.querySelector('#header-parameters, #Header-Parameters, #HeaderParameters'));
        const searchParams = parseParams(div.querySelector('#search-parameters,  #Search-Parameters, #SearchParameters'));
        const responseInfos = parseResponseInfos(div.querySelector('#responses, #Responses'));

        div.innerHTML = "";
        if (_apiType === ApiType.FHIRResource) {
            if (cap && resourceType) {
                renderCapabilityStatementResourceApiDocumentation(div, cap, resourceType, interaction, operationId, urlPath, description, requestExamples, responseExamples);
            } else if (capUrl && resourceType) {
                utils.loadData(capUrl).then(data => renderCapabilityStatementResourceApiDocumentation(div, data, resourceType, interaction, operationId, urlPath, description, requestExamples, responseExamples));
            }
        } else if (_apiType === ApiType.FHIROperation) {
            if (cap) {
                renderWithOperationDefinition(div, cap, operationDefinition, operationDefinitionUrl, invokeLevel, resourceType, operationId, urlPath, description, requestExamples, responseExamples);
            } else if (capUrl) {
                utils.loadData(capUrl).then(data => renderWithOperationDefinition(div, data, operationDefinition, operationDefinitionUrl, invokeLevel, resourceType, operationId, urlPath, description, requestExamples, responseExamples));
            }
        } else if (_apiType === ApiType.CUSTOM) {
            if (!capUrl) {
                renderCustomApiDocumentation(div, urlPath, httpMethod, operationId, formats, description, requestExamples, responseExamples, headerParams, searchParams, responseInfos, cap);
            } else {
                utils.loadData(capUrl).then(data => renderCustomApiDocumentation(div, urlPath, httpMethod, operationId, formats, description, requestExamples, responseExamples, headerParams, searchParams, responseInfos, data));
            }
        }
    });
}

function renderWithOperationDefinition(parent, capability, operationDefinition, operationDefinitionUrl, invokeLevel, resourceType=null, operationId=null, urlPath=null, description=null, requestExamples=null, responseExamples=null) {
    if (!capability) {
        console.error(`CapabilityStatement is required but was not provided! CapabilityStatement is ${capability}.`);
        return;
    }
    if (!operationDefinition && !operationDefinitionUrl) {
        console.error(`OperationDefinition is required but was not provided!`);
        return;
    }
    if (operationDefinition) {
        renderCapabilityStatementOperationApiDocumentation(parent, capability, operationDefinition, invokeLevel, resourceType, operationId, urlPath, description, requestExamples, responseExamples);
    } else if (operationDefinitionUrl) {
        utils.loadData(operationDefinitionUrl).then(data => renderCapabilityStatementOperationApiDocumentation(parent, capability, data, invokeLevel, resourceType, operationId, urlPath, description, requestExamples, responseExamples));
    }
}


const MAP_METHODS = {
    "read": "GET",
    "vread": "GET",
    "update": "PUT",
    "patch": "PATCH",
    "delete": "DELETE",
    "history-instance": "GET",
    "history-type": "GET",
    "create": "POST",
    "search-type": "GET",
    "_search": "POST"
};

const MAP_URL_PATH = {
    "read": "{resourceType}/[id]",
    "vread": "{resourceType}/[id]/_history/[vid]",
    "update": "{resourceType}/[id]",
    "patch": "{resourceType}/[id]",
    "delete": "{resourceType}/[id]",
    "history-instance": "{resourceType}/[id]/_history",
    "history-type": "{resourceType}/_history",
    "create": "{resourceType}",
    "search-type": "{resourceType}",
    "_search": "{resourceType}/_search"
};

const MAP_OPERATION_PATH = {
    "system": "${code}",
    "type": "{resourceType}/${code}",
    "instance": "{resourceType}/[id]/${code}"
};

function parseBaseUrl(fullUrl) {
    if (typeof fullUrl !== "string") return [null, ""];

    try {
        const parsed = new URL(fullUrl);
        const host = `${parsed.protocol}//${parsed.host}`;
        let path = parsed.pathname.replace(/\/$/, "");
        if (!path.endsWith("/")) {
            path += "/";
        }
        if (path.startsWith("/")) {
            path = path.slice(1);
        }

        return [host, path];
    } catch {
        console.warn("Wrong URL:", fullUrl);
        return [null, ""];
    }
}

function removeLeadingTabs(text) {
    return text.replace(/^[\t ]+/gm, '');
}



const createCopyButton = (data, language = null) => {
    const wrapper = utils.createElement('div', { classes: ['gem-ig-copy-container'] });
    const languageElement = utils.createElement('span', { classes: ['gem-id-code-lang'] })
    if (language) {
        languageElement.innerText = language.toLowerCase();
    }
    // The Copy Button
    const buttonWrapper = utils.createElement('div', { classes: ['gem-ig-copy-button-wrapper'] });
    const button = utils.createElement('button', { innerHTML: gematikLabels.apiDoc.Copy_Button_Label});
    // Add click event listener to copy button
    button.addEventListener('click', function () {
        navigator.clipboard.writeText(data).then(() => {
            button.innerText = gematikLabels.apiDoc.Copied_Button_Label;
            setTimeout(() => button.innerText = gematikLabels.apiDoc.Copy_Button_Label, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    });
    wrapper.appendChild(languageElement);
    buttonWrapper.appendChild(button);
    wrapper.appendChild(buttonWrapper);
    return wrapper;
};

const renderApiExample = (parent, buttonParent, example, data, exampleList, buttonList) => {
    let renderType = example.render?.toLowerCase() || example.type?.toLowerCase() ;
    const exampleContainer = utils.createElement('pre', { attributes: { style: 'display: none' } });

    let content = data;
    if (renderType.toUpperCase() == "IG-FRAGMENT") {
        content = utils.createElement('div', {classes:['html-example'], innerHTML: data}).innerText;
    }
    // The Copy Button
    exampleContainer.appendChild(createCopyButton(content, example.type.toLowerCase()));
    if (renderType.toUpperCase() == "HTML") {
        exampleContainer.appendChild(
            utils.createElement('div', {classes:['html-example'], innerHTML: content})
        );
    } else {
        const view = utils.createElement('code', {
            innerHTML: hljs.highlight(content, { language: example.type.toLowerCase() }).value
        });
        exampleContainer.appendChild(view);
    }
    exampleList.push(exampleContainer);

    const toggleButton = utils.createElement('button', {
        classes: ['example', 'inline-button'],
        children: [
            utils.createElement('span', { classes: ['label'], innerHTML: example.type.toUpperCase() }),
            utils.createElement('span', { innerHTML: example.name })
        ]
    });
    toggleButton.addEventListener('click', () => {
        exampleList.forEach(elem => elem.style.display = (elem === exampleContainer && elem.style.display !== 'block') ? 'block' : 'none');
        buttonList.forEach(btn => btn.classList.toggle('active-button', btn === toggleButton && exampleContainer.style.display === 'block'));
    });
    buttonList.push(toggleButton);
    buttonParent.appendChild(toggleButton);
    parent.appendChild(exampleContainer);
};


const appendExampleElements = (exampleData, container) => {
    const examplesButtonContainer = utils.createElement('div', { classes: ['operation-block-description'] });
    const examplesContainer = utils.createElement('div', { classes: ['operation-block-description', 'operation-example'] });
    container.appendChild(examplesButtonContainer);
    container.appendChild(examplesContainer);

    const exampleList = [], buttonList = [];
    exampleData.forEach(example => {
        if (example.data) {
            renderApiExample(examplesContainer, examplesButtonContainer, example, example.data, exampleList, buttonList);
        } else if (example.url) {
            utils.loadData(example.url).then(data => renderApiExample(examplesContainer, examplesButtonContainer, example, data, exampleList, buttonList));
        }
    });
};


function createOperationMainBlock(httpMethod, urlPath) {
    const operationMainBlock = utils.createElement('div', { classes: ['operation-block'], children: [
        utils.createElement('div', { classes: ['operation-block-summary'], children: [
            utils.createElement('div', {
                classes: ['operation-block-summary-control'],
                attributes: { 'aria-expanded': false },
                children: [
                    utils.createElement('span', { classes: ['operation-block-summary-method'], innerHTML: httpMethod.toUpperCase() }),
                    utils.createElement('div', { classes: ['operation-block-summary-path'], innerHTML: urlPath })
                ]
            })
        ]
        })
    ] });
    operationMainBlock.classList.add(`operation-block-${httpMethod.toLowerCase()}`);
    return operationMainBlock;
}


function appendInfoBox(parent, operationId=null, formats=[], description=null) {
    let withLowPadding = false;
    if (operationId) {
        parent.appendChild(utils.createElement('div', { classes: ['operation-block-description'], innerHTML: `${gematikLabels.apiDoc.OperationId_Label}: <b>${operationId}</b>` }));
        withLowPadding = true;
    }
    if (formats?.length) {
        const contentTypeHtml= formats.map(value => `<b>${value}</b>`);
        let classesContentType = ['operation-block-description'];
        if (withLowPadding) {
            classesContentType.push('low-padding');
        }
        parent.appendChild(utils.createElement('div', { classes: classesContentType, innerHTML: `${gematikLabels.apiDoc.ContentTypes_Label}: <b>${contentTypeHtml.join(", ")}</b>` }));
    }
    // description
    if (description) {
        description = removeLeadingTabs(description);
        parent.appendChild(utils.createElement('div', { classes: ['operation-block-description'], innerHTML: `${description}` }));
    }
}

function appendHeaderInfo(parent, headerParams, formats, httpMethod=null) {
    if(!headerParams) {
        headerParams = [];
    }
    let headerParamsRows = [];
    let acceptHeaderValue = "*/*";
    if (Array.isArray(formats) && formats.length > 1) {
        acceptHeaderValue = formats.join(', ');
    }
    headerParamsRows.push([
        'Accept',
        '<code>string</code>',
        `Formats: <code>${acceptHeaderValue}</code>`
    ]);
    parent.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: gematikLabels.apiDoc.HeaderParams_Header }));
    headerParamsRows = headerParamsRows.concat(
        headerParams.map(({ name, type, description, expectation }) => [
            name,
            `<code>${type}</code>`,
            description
            // expectation
        ])
    );
    parent.appendChild(utils.createElement('div', { classes: ['operation-block-description', 'with-table'], children: [utils.createTable([
        gematikLabels.apiDoc.Parameter_Label,
        gematikLabels.apiDoc.Type_Label,
        gematikLabels.apiDoc.Description_Label,
        // gematikLabels.apiDoc.Expectation_Label
    ], headerParamsRows, true, ['params-table'])] }));
}


function appendExamples(parent, forRequest, forResponse) {

    if (forRequest?.length) {
        parent.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: gematikLabels.apiDoc.RequestExample_Header }));
        appendExampleElements(forRequest, parent);
    }

    if (forResponse?.length) {
        parent.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: gematikLabels.apiDoc.ResponseExample_Header }));
        appendExampleElements(forResponse, parent);
    }

}


function appendResponseInfo(parent, responseInfos) {
    if (responseInfos) {
        parent.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: gematikLabels.apiDoc.Response_Header }));
        const responseRows = responseInfos.slice()
            .sort((a, b) => Number(a.statusCode) - Number(b.statusCode))
            .map(({ statusCode, description, errorCode, responseType }) => [
                `<code>${statusCode}</code>`, 
                description, 
                errorCode, 
                responseType
            ]);
        parent.appendChild(utils.createElement('div', { classes: ['operation-block-description', 'with-table'], children: [utils.createTable([
            gematikLabels.apiDoc.StatusCode_Label,
            gematikLabels.apiDoc.Description_Label,
            gematikLabels.apiDoc.ErrorCode_Label,
            gematikLabels.apiDoc.Response_Type
        ], responseRows)] }));
    }
}

function appendSearchParameters(parent, params, httpMethod, formats=null) {
    if(!params | params.length == 0) {
        params = [];
    }
    // In OperationDefinition resources, parameters named "resource" are typically used to describe the request body structure.
    // This is not formally required by the FHIR spec but considered best practice.
    // Therefore, we exclude such parameters from the list of query/search parameters.
    const searchParametersRows = params
        .filter(({ name }) => name !== "resource")
        .map(({ name, definition, type, documentation, expectation }) => [
            name,
            `<code>${type}</code>`,
            documentation,
        // expectation
        ]);
    if (Array.isArray(formats) && formats.length > 1) {
        const alreadyHasFormat = searchParametersRows.some(row => row[0] === '_format');
        if (!alreadyHasFormat) {
            const _formatValue = formats.join(', ');
            const element = [
                '_format',
                '<code>string</code>',
                `Specify alternative response formats by their MIME-types (when a client is unable acccess accept: header) Available values : ${_formatValue}`,
                // 'MAY'
            ];
            searchParametersRows.unshift(element);
        }
    }
    if(!searchParametersRows | searchParametersRows.length == 0) {
        return;
    }
    parent.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: gematikLabels.apiDoc.SearchParams_Header }));
    parent.appendChild(utils.createElement('div', { classes: ['operation-block-description', 'with-table'], children: [utils.createTable([
        gematikLabels.apiDoc.Parameter_Label,
        gematikLabels.apiDoc.Type_Label,
        gematikLabels.apiDoc.Documentation_Label,
        // gematikLabels.apiDoc.Expectation_Label
    ], searchParametersRows, true, ['params-table'])] }));

}


function renderCapabilityStatementResourceApiDocumentation(parent, capability, resourceType, interaction, operationId=null, urlPath=null, description=null, requestExamples=null, responseExamples=null) {
    if (!capability) {
        console.error(`CapabilityStatement is required but was not provided. CapabilityStatement is ${capability}!`);
        return;
    }
    let _interaction = interaction;
    if (_interaction == "_search") {
        _interaction = "search-type";
    }
    parent.classList.add("gem-ig-api-doc");
    const fhirData = fhir.parseFhirCapabilityStatement(capability, resourceType, _interaction);
    if (!(interaction in MAP_METHODS)) {
        console.warn(`Interaction code "${interaction}" is not mapped to an HTTP method.`);
        return;
    }
    if(!urlPath) {
        urlPath = MAP_URL_PATH[interaction].replace("{resourceType}", resourceType);
    }
    const [host, path] = parseBaseUrl(fhirData.baseUrl);
    const urlBase = "[base]/" + path
    const operationMainBlock = createOperationMainBlock(MAP_METHODS[interaction], urlBase ? `${urlBase}${urlPath}` : urlPath);
    parent.appendChild(operationMainBlock);

    appendInfoBox(operationMainBlock, operationId, fhirData.formats, description);

    appendHeaderInfo(operationMainBlock, fhirData.headerParams, fhirData.formats, MAP_METHODS[interaction]);
    const searchParameters = _interaction === "search-type" ? fhirData.searchParams : [];
    appendSearchParameters(operationMainBlock, searchParameters, MAP_METHODS[interaction], fhirData.formats);


    if (fhirData.searchInclude || fhirData.searchRevInclude) {
        if (_interaction == "search-type") {
            operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: gematikLabels.apiDoc.SearchInclude_And_RevInclude_Header }));
            const rows = Array.from({ length: Math.max(fhirData.searchInclude?.length || 0, fhirData.searchRevInclude?.length || 0) }, (_, i) => [
                fhirData.searchInclude?.[i] || '',
                fhirData.searchRevInclude?.[i] || ''
            ]);
            operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-description', 'with-table'], children: [utils.createTable(['Include', 'RevInclude'], rows)] }));
        }
    }

    appendExamples(operationMainBlock, requestExamples, responseExamples);
    appendResponseInfo(operationMainBlock, fhirData.responseInfos);
}


function renderCapabilityStatementOperationApiDocumentation(parent, capability, operationDefinition, invokeLevel, resourceType=null, operationId=null, urlPath=null, description=null, requestExamples=null, responseExamples=null) {
    parent.classList.add("gem-ig-api-doc");
    const fhirData = fhir.parseFhirOperationCapabilityStatement(capability, operationDefinition, invokeLevel, resourceType);
    fhirData.methods.forEach(httpMethod => {
        if (!(invokeLevel in MAP_OPERATION_PATH)) {
            console.warn(`Invoke level "${invokeLevel}" is not supported.`);
            return;
        }
        if(!urlPath) {
            urlPath = MAP_OPERATION_PATH[invokeLevel].replace("{resourceType}", resourceType).replace("{code}", fhirData.code);
        }
        const [host, path] = parseBaseUrl(fhirData.baseUrl);
        const urlBase = "[base]/" + path

        const operationMainBlock = createOperationMainBlock(httpMethod, urlBase ? `${urlBase}${urlPath}` : urlPath);
        parent.appendChild(operationMainBlock);

        appendInfoBox(operationMainBlock, operationId, fhirData.formats, description);
        appendHeaderInfo(operationMainBlock, fhirData.headerParams, fhirData.formats, httpMethod);
        appendSearchParameters(operationMainBlock, fhirData.searchParams, httpMethod, fhirData.formats);
        appendExamples(operationMainBlock, requestExamples, responseExamples);
        appendResponseInfo(operationMainBlock, fhirData.responseInfos);
    });
}


function renderCustomApiDocumentation(parent, urlPath, httpMethod, operationId=null, formats=null, description=null, requestExamples=null, responseExamples=null, headerParams=null, searchParams=null, responseInfos=null, capability=null) {
    parent.classList.add("gem-ig-api-doc");
    const METHOD = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"];
    httpMethod = String(httpMethod || "").toUpperCase();
    if(!(METHOD.includes(httpMethod))) {
        console.warn(`This HTTP method "${httpMethod}" is not supported. Default: GET`);
        httpMethod = "GET";
    }
    const urlBase = "[base]/"
    urlPath = utils.removeLeadingSlash(urlPath);
    const operationMainBlock = createOperationMainBlock(httpMethod, urlBase ? `${urlBase}${urlPath}` : urlPath);
    parent.appendChild(operationMainBlock);

    appendInfoBox(operationMainBlock, operationId, formats, description);

    headerParams = headerParams || []
    responseInfos = responseInfos || []
    if(capability) {
        const fhirData = fhir.parseGlobalServerInfo(capability);
        headerParams = [...headerParams, ...fhirData.headerParams];
        responseInfos = [...responseInfos, ...fhirData.responseInfos];
    }
    appendHeaderInfo(operationMainBlock, headerParams, [], httpMethod);
    appendSearchParameters(operationMainBlock, searchParams, httpMethod, []);
    appendExamples(operationMainBlock, requestExamples, responseExamples);
    appendResponseInfo(operationMainBlock, responseInfos);
}