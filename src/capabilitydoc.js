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
    const capDivs = document.querySelectorAll('.gematik-apidoc');
    // const capDivs = document.querySelectorAll('div[data-api-fhir-capabilitystatement-url], div[data-api-fhir-capabilitystatement]');
    capDivs.forEach(div => {
        const resourceType = div.getAttribute('data-api-fhir-resource-type');
        const interaction = div.getAttribute('data-api-fhir-interaction');
        const operationId = div.getAttribute('data-api-operation-id');
        const urlPath = div.getAttribute('data-api-url-path');

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
        if (cap && resourceType) {
            renderCapabilityStatementApiDocumentation(cap, resourceType, interaction, div, operationId, urlPath, description, requestExamples, responseExamples)
        } else if (capUrl && resourceType) {
            utils.loadData(capUrl).then(data => renderCapabilityStatementApiDocumentation(data, resourceType, interaction, div, operationId, urlPath, description, requestExamples, responseExamples));
        }
    });
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
    "search-type": "GET"
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
    "search-type": "{resourceType}"
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


function renderCapabilityStatementApiDocumentation(data, resourceType, interaction, parent, operationId=null, urlPath=null, description=null, requestExamples=null, responseExamples=null) {
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

    const operationMainBlock = utils.createElement('div', { classes: ['operation-block'], children: [
        utils.createElement('div', { classes: ['operation-block-summary'], children: [
            utils.createElement('div', {
                classes: ['operation-block-summary-control'],
                attributes: { 'aria-expanded': false },
                children: [
                    utils.createElement('span', { classes: ['operation-block-summary-method'], innerHTML: MAP_METHODS[interaction].toUpperCase() }),
                    utils.createElement('div', { classes: ['operation-block-summary-path'], innerHTML: urlBase ? `${urlBase}${urlPath}` : urlPath })
                ]
            })
        ]
        })
    ] });
    operationMainBlock.classList.add(`operation-block-${MAP_METHODS[interaction].toLowerCase()}`);
    parent.appendChild(operationMainBlock);

    let withLowPadding = false;
    if (operationId) {
        operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-description'], innerHTML: `${window.gematikLabels.apiDoc.OperationId_Label}: <b>${operationId}</b>` }));
        withLowPadding = true;
    }
    if (fhirData.formats?.length) {
        const contentTypeHtml= fhirData.formats.map(value => `<b>${value}</b>`);
        let classesContentType = ['operation-block-description'];
        if (withLowPadding) {
            classesContentType.push('low-padding');
        }
        operationMainBlock.appendChild(utils.createElement('div', { classes: classesContentType, innerHTML: `${window.gematikLabels.apiDoc.ContentTypes_Label}: <b>${contentTypeHtml.join(", ")}</b>` }));
    }
    // description
    if (description) {
        description = removeLeadingTabs(description);
        operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-description'], innerHTML: `${description}` }));
    }
    if (fhirData.headerParams?.length) {
        operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.gematikLabels.apiDoc.HeaderParams_Header }));
        const headerParamsRows = fhirData.headerParams.map(({ name, type, description, expectation }) => [
            name,
            `<code>${type}</code>`, 
            description, 
            // expectation
        ]);
        operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-description', 'with-table'], children: [utils.createTable([
            window.gematikLabels.apiDoc.Parameter_Label,
            window.gematikLabels.apiDoc.Type_Label,
            window.gematikLabels.apiDoc.Description_Label,
            // window.gematikLabels.apiDoc.Expectation_Label
        ], headerParamsRows, true, ['params-table'])] }));
    }


    if (fhirData.searchParams?.length & (interaction == "search-type" | (interaction == "update" & fhirData.conditionalUpdate))) {
        operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.gematikLabels.apiDoc.SearchParams_Header }));
        const searchParametersRows = fhirData.searchParams.map(({ name, definition, type, documentation, expectation }) => [
            name,
            `<code>${type}</code>`,
            documentation,
            // expectation
        ]);
        operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-description', 'with-table'], children: [utils.createTable([
            window.gematikLabels.apiDoc.Parameter_Label,
            window.gematikLabels.apiDoc.Type_Label,
            window.gematikLabels.apiDoc.Documentation_Label,
            // window.gematikLabels.apiDoc.Expectation_Label
        ], searchParametersRows, true, ['params-table'])] }));
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


    if (requestExamples?.length) {
        operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.gematikLabels.apiDoc.RequestExample_Header }));
        appendExampleElements(requestExamples, operationMainBlock);
    }

    if (responseExamples?.length) {
        operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.gematikLabels.apiDoc.ResponseExample_Header }));
        appendExampleElements(responseExamples, operationMainBlock);
    }

    if (fhirData.responseInfos) {
        operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.gematikLabels.apiDoc.Response_Header }));
        const responseRows = fhirData.responseInfos.map(({ statusCode, description, errorCode, responseType }) => [
            `<code>${statusCode}</code>`, 
            description, 
            errorCode, 
            responseType
        ]);
        operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-description', 'with-table'], children: [utils.createTable([
            window.gematikLabels.apiDoc.StatusCode_Label,
            window.gematikLabels.apiDoc.Description_Label,
            window.gematikLabels.apiDoc.ErrorCode_Label,
            window.gematikLabels.apiDoc.Content_Type
        ], responseRows)] }));
    }

}