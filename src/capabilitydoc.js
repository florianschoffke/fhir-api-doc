import fhir from './fhir.js';
import utils from './utils.js';
import labels from './labels.js';

import jsyaml from 'js-yaml';
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
    const exampleDivs = Array.from(container.querySelectorAll('div[data-name][data-type]'));

    return exampleDivs.map(div => {
        const name = div.getAttribute('data-name');
        const type = div.getAttribute('data-type');
        const url = div.getAttribute('data-url');

        return {
        name,
        type,
        ...(url
            ? { url }
            : { data: div.innerHTML.trim() }
        )
        };
    });
}

function renderCapabilityStatementApiDoc() {
    const capDivs = document.querySelectorAll('.gematik-apidoc, .gematik-api');
    // const capDivs = document.querySelectorAll('div[data-api-fhir-capabilitystatement-url], div[data-api-fhir-capabilitystatement]');
    capDivs.forEach(div => {
        const _apiType = div.getAttribute('data-api-type');
        const resourceType = div.getAttribute('data-api-fhir-resource-type');
        const interaction = div.getAttribute('data-api-fhir-interaction');
        const operationId = div.getAttribute('data-api-operation-id');
        const urlPath = div.getAttribute('data-api-url-path');

        // const operationDefinition = div.getAttribute('data-api-fhir-operation-definition');
        const invokeLevel = div.getAttribute('data-api-fhir-invoke-level');

        const descriptionDiv = div.querySelector('#api-description');
        const description = descriptionDiv?.innerHTML?.trim() ?? '';

        let cap = null;
        let capUrl = null;
        const capabilityStatementContainer = div.querySelector('#CapabilityStatement');
        if (capabilityStatementContainer) {
            capUrl = capabilityStatementContainer.getAttribute('data-url');
            if(utils.isJson(capabilityStatementContainer.textContent)) {
                cap = capabilityStatementContainer.textContent;
            }
        }

        let operationDefinition = null;
        let operationDefinitionUrl = null;
        const operationDefinitionContainer = div.querySelector('#OperationDefinition');
        if (operationDefinitionContainer) {
            operationDefinitionUrl = operationDefinitionContainer.getAttribute('data-url');
            if(utils.isJson(operationDefinitionContainer.textContent)) {
                operationDefinition = operationDefinitionContainer.textContent;
            }
        }

        let responseExamples = null;
        const responseExamplesContainer = div.querySelector('#api-response-examples');
        if (responseExamplesContainer) {
            responseExamples = parseExampleDivs(responseExamplesContainer);
        }

        let requestExamples = null;
        const requestExamplesContainer = div.querySelector('#api-request-examples');
        if (requestExamplesContainer) {
            requestExamples = parseExampleDivs(requestExamplesContainer);
        }

        div.innerHTML = "";
        if (_apiType === ApiType.FHIRResource) {
            if (cap && resourceType) {
                renderCapabilityStatementResourceApiDocumentation(cap, resourceType, interaction, div, operationId, urlPath, description, requestExamples, responseExamples);
            } else if (capUrl && resourceType) {
                utils.loadData(capUrl).then(data => renderCapabilityStatementResourceApiDocumentation(data, resourceType, interaction, div, operationId, urlPath, description, requestExamples, responseExamples));
            }
        } else if (_apiType === ApiType.FHIROperation) {
            if (cap) {
                renderWithOperationDefinition(cap, operationDefinition, operationDefinitionUrl, invokeLevel, div, resourceType, operationId, urlPath, description, requestExamples, responseExamples);
            } else if (capUrl) {
                utils.loadData(capUrl).then(data => renderWithOperationDefinition(data, operationDefinition, operationDefinitionUrl, invokeLevel, div, resourceType, operationId, urlPath, description, requestExamples, responseExamples));
            }
        }
    });
}

function renderWithOperationDefinition(capability, operationDefinition, operationDefinitionUrl, invokeLevel, parent, resourceType=null, operationId=null, urlPath=null, description=null, requestExamples=null, responseExamples=null) {
    if (!capability) {
        console.error(`CapabilityStatement is ${capability}!`);
        return;
    }
    if (operationDefinition) {
        renderCapabilityStatementOperationApiDocumentation(capability, operationDefinition, invokeLevel, parent, resourceType, operationId, urlPath, description, requestExamples, responseExamples);
    } else if (operationDefinitionUrl) {
        utils.loadData(operationDefinitionUrl).then(data => renderCapabilityStatementOperationApiDocumentation(capability, data, invokeLevel, parent, resourceType, operationId, urlPath, description, requestExamples, responseExamples));
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
    } catch (e) {
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
    const button = utils.createElement('button', { innerHTML: window.gematikLabels.apiDoc.Copy_Button_Label});
    // Add click event listener to copy button
    button.addEventListener('click', function () {
        navigator.clipboard.writeText(data).then(() => {
            button.innerText = window.gematikLabels.apiDoc.Copied_Button_Label;
            setTimeout(() => button.innerText = window.gematikLabels.apiDoc.Copy_Button_Label, 2000);
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
    const exampleContainer = utils.createElement('pre', { attributes: { style: 'display: none' } });
    // The Copy Button
    const copyButton = createCopyButton(data, example.type.toLowerCase());
    exampleContainer.appendChild(copyButton);

    const code = utils.createElement('code', {
        innerHTML: hljs.highlight(data, { language: example.type.toLowerCase() }).value
    });
    exampleContainer.appendChild(code);
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
        parent.appendChild(utils.createElement('div', { classes: ['operation-block-description'], innerHTML: `${window.gematikLabels.apiDoc.OperationId_Label}: <b>${operationId}</b>` }));
        withLowPadding = true;
    }
    if (formats?.length) {
        const contentTypeHtml= formats.map(value => `<b>${value}</b>`);
        let classesContentType = ['operation-block-description'];
        if (withLowPadding) {
            classesContentType.push('low-padding');
        }
        parent.appendChild(utils.createElement('div', { classes: classesContentType, innerHTML: `${window.gematikLabels.apiDoc.ContentTypes_Label}: <b>${contentTypeHtml.join(", ")}</b>` }));
    }
    // description
    if (description) {
        description = removeLeadingTabs(description);
        parent.appendChild(utils.createElement('div', { classes: ['operation-block-description'], innerHTML: `${description}` }));
    }
}

function appendHeaderInfo(parent, fhirData, httpMethod=null) {
    if (fhirData.headerParams?.length) {
        parent.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.gematikLabels.apiDoc.HeaderParams_Header }));
        const headerParamsRows = fhirData.headerParams.map(({ name, type, description, expectation }) => [
            name,
            `<code>${type}</code>`, 
            description, 
            // expectation
        ]);
        if (httpMethod === "GET" && Array.isArray(fhirData.formats) && fhirData.formats.length > 1) {
            const acceptHeaderValue = fhirData.formats.join(', ');
            headerParamsRows.push([
                'Accept',
                '<code>string</code>',
                `Formats: <code>${acceptHeaderValue}</code>`
            ]);
        }
        parent.appendChild(utils.createElement('div', { classes: ['operation-block-description', 'with-table'], children: [utils.createTable([
            window.gematikLabels.apiDoc.Parameter_Label,
            window.gematikLabels.apiDoc.Type_Label,
            window.gematikLabels.apiDoc.Description_Label,
            // window.gematikLabels.apiDoc.Expectation_Label
        ], headerParamsRows, true, ['params-table'])] }));
    }
}


function appendExamples(parent, forRequest, forResponse) {

    if (forRequest?.length) {
        parent.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.gematikLabels.apiDoc.RequestExample_Header }));
        appendExampleElements(forRequest, parent);
    }

    if (forResponse?.length) {
        parent.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.gematikLabels.apiDoc.ResponseExample_Header }));
        appendExampleElements(forResponse, parent);
    }

}


function appendResponseInfo(parent, fhirData) {
    if (fhirData.responseInfos) {
        parent.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.gematikLabels.apiDoc.Response_Header }));
        const responseRows = fhirData.responseInfos.map(({ statusCode, description, errorCode, responseType }) => [
            `<code>${statusCode}</code>`, 
            description, 
            errorCode, 
            responseType
        ]);
        parent.appendChild(utils.createElement('div', { classes: ['operation-block-description', 'with-table'], children: [utils.createTable([
            window.gematikLabels.apiDoc.StatusCode_Label,
            window.gematikLabels.apiDoc.Description_Label,
            window.gematikLabels.apiDoc.ErrorCode_Label,
            window.gematikLabels.apiDoc.Content_Type
        ], responseRows)] }));
    }
}

function appendSearchParameters(parent, fhirData) {
    parent.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.gematikLabels.apiDoc.SearchParams_Header }));
    const searchParametersRows = fhirData.searchParams.map(({ name, definition, type, documentation, expectation }) => [
        name,
        `<code>${type}</code>`,
        documentation,
        // expectation
    ]);
    parent.appendChild(utils.createElement('div', { classes: ['operation-block-description', 'with-table'], children: [utils.createTable([
        window.gematikLabels.apiDoc.Parameter_Label,
        window.gematikLabels.apiDoc.Type_Label,
        window.gematikLabels.apiDoc.Documentation_Label,
        // window.gematikLabels.apiDoc.Expectation_Label
    ], searchParametersRows, true, ['params-table'])] }));

}


function renderCapabilityStatementResourceApiDocumentation(data, resourceType, interaction, parent, operationId=null, urlPath=null, description=null, requestExamples=null, responseExamples=null) {
    parent.classList.add("gem-ig-api-doc");
    const fhirData = fhir.parseFhirCapabilityStatement(data, resourceType, interaction);
    if (!(interaction in MAP_METHODS)) {
        console.warn(`Interaction code "${interaction.code}" is not mapped to an HTTP method.`);
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

    appendHeaderInfo(operationMainBlock, fhirData, MAP_METHODS[interaction]);

    if (fhirData.searchParams?.length & (interaction == "search-type" | interaction == "_search" | (interaction == "update" & fhirData.conditionalUpdate))) {
        appendSearchParameters(operationMainBlock, fhirData);
    }

    if (fhirData.searchInclude || fhirData.searchRevInclude) {
        if (interaction == "search-type") {
            operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.gematikLabels.apiDoc.SearchInclude_And_RevInclude_Header }));
            const rows = Array.from({ length: Math.max(fhirData.searchInclude?.length || 0, fhirData.searchRevInclude?.length || 0) }, (_, i) => [
                fhirData.searchInclude?.[i] || '',
                fhirData.searchRevInclude?.[i] || ''
            ]);
            operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-description', 'with-table'], children: [utils.createTable(['Include', 'RevInclude'], rows)] }));
        }
    }

    appendExamples(operationMainBlock, requestExamples, responseExamples);
    appendResponseInfo(operationMainBlock, fhirData);
}


function renderCapabilityStatementOperationApiDocumentation(capability, operationDefinition, invokeLevel, parent, resourceType=null, operationId=null, urlPath=null, description=null, requestExamples=null, responseExamples=null) {
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
        appendHeaderInfo(operationMainBlock, fhirData, httpMethod);
        if (fhirData.searchParams?.length) {
            appendSearchParameters(operationMainBlock, fhirData);
        }
        appendExamples(operationMainBlock, requestExamples, responseExamples);
        appendResponseInfo(operationMainBlock, fhirData);
    });
}