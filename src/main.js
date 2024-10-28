import yaml from 'js-yaml';
import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';

hljs.registerLanguage('xml', xml);
hljs.registerLanguage('json', json);

// Globale Variablen für Beschriftungen
window.fhirApiDocLabels = window.fhirApiDocLabels || {
    searchParams_Header: "Suchparameter",
    searchParams_Parameter_Label: "Parameter",
    searchParams_Type_Label: "Type",
    searchParams_Documentation_Label: "Beschreibung",
    searchParams_Expectation_Label: "Anforderung",
    response_Header: "Status Codes",
    response_StatusCode_Label: "Status Code",
    response_Description_Label: "Beschreibung",
    response_ErrorCode_Label: "Error Code",
    response_Note_Label: "Bemerkung",
    searchInclude_And_RevInclude_Header: "Suche per Include und RevInclude",
    requestExample_Header: "Beispielanfrage",
    responseExample_Header: "Beispielantworten",
    operationId_Label: "OperationId",
    expectation_SHALL: "MUSS",
    expectation_SHOULD: "SOLLTE",
    expectation_MAY: "DARF",
    expectation_OPTIONAL: "OPTIONAL"
};

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('fhir-api-doc').forEach(apiDoc => {
        const script = apiDoc.querySelector('script[type="text/yaml"]');
        if (script) {
            const parsedYaml = yaml.load(script.textContent);
            renderApiDocumentation(apiDoc, parsedYaml);
        }
    });
});

const createElement = (tag, { classes = [], attributes = {}, innerHTML = '', children = [] } = {}) => {
    const element = Object.assign(document.createElement(tag), { innerHTML });
    classes.forEach(cls => element.classList.add(cls));
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    children.forEach(child => element.appendChild(child));
    return element;
};

const createTable = (headers, rows, includeHeader = true) => {
    const table = createElement('table', { attributes: { style: 'width: 100%' } });
    if (includeHeader) {
        const thead = createElement('thead');
        thead.appendChild(createElement('tr', {
            children: headers.map(headerText => createElement('th', { innerHTML: headerText }))
        }));
        table.appendChild(thead);
    }
    const tbody = createElement('tbody');
    rows.forEach(rowData => {
        tbody.appendChild(createElement('tr', {
            children: rowData.map(cellData => createElement('td', { innerHTML: cellData }))
        }));
    });
    table.appendChild(tbody);
    return table;
};

const loadData = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Response status: ${response.status}`);
        return await response.text();
    } catch (error) {
        console.error(error.message);
        return "";
    }
};

const renderApiExample = (parent, buttonParent, example, data, exampleList, buttonList) => {
    const exampleContainer = createElement('pre', { attributes: { style: 'display: none' } });
    const code = createElement('code', {
        innerHTML: hljs.highlight(data, { language: example.type.toLowerCase() }).value
    });
    exampleContainer.appendChild(code);
    exampleList.push(exampleContainer);

    const toggleButton = createElement('button', {
        classes: ['example', 'inline-button'],
        children: [
            createElement('span', { classes: ['label'], innerHTML: example.type.toUpperCase() }),
            createElement('span', { innerHTML: example.name })
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
    const examplesButtonContainer = createElement('div', { classes: ['operation-block-description'] });
    const examplesContainer = createElement('div', { classes: ['operation-block-description', 'operation-example'] });
    container.appendChild(examplesButtonContainer);
    container.appendChild(examplesContainer);

    const exampleList = [], buttonList = [];
    exampleData.forEach(example => {
        if (example.data) {
            renderApiExample(examplesContainer, examplesButtonContainer, example, example.data, exampleList, buttonList);
        } else if (example.url) {
            loadData(example.url).then(data => renderApiExample(examplesContainer, examplesButtonContainer, example, data, exampleList, buttonList));
        }
    });
};

const appendFhirDetails = (fhirData, parent) => {
    if (fhirData.searchParams?.length) {
        parent.appendChild(createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.fhirApiDocLabels.searchParams_Header }));
        const searchParametersRows = fhirData.searchParams.map(({ name, definition, type, documentation, expectation }) => [
            `<a href="${definition}" target="_blank">${name}</a>`,
            `<code>${type}</code>`,
            documentation,
            expectation
        ]);
        parent.appendChild(createElement('div', { classes: ['operation-block-description'], children: [createTable([
            window.fhirApiDocLabels.searchParams_Parameter_Label,
            window.fhirApiDocLabels.searchParams_Type_Label,
            window.fhirApiDocLabels.searchParams_Documentation_Label,
            window.fhirApiDocLabels.searchParams_Expectation_Label
        ], searchParametersRows)] }));
    }

    if (fhirData.searchInclude || fhirData.searchRevInclude) {
        parent.appendChild(createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.fhirApiDocLabels.searchInclude_And_RevInclude_Header }));
        const rows = Array.from({ length: Math.max(fhirData.searchInclude?.length || 0, fhirData.searchRevInclude?.length || 0) }, (_, i) => [
            fhirData.searchInclude?.[i] || '',
            fhirData.searchRevInclude?.[i] || ''
        ]);
        parent.appendChild(createElement('div', { classes: ['operation-block-description'], children: [createTable(['Include', 'RevInclude'], rows)] }));
    }
};

const renderApiDocumentation = (container, apiData) => {
    if (apiData.paths) {
        Object.entries(apiData.paths).forEach(([path, pathData]) => {
            Object.entries(pathData).forEach(([method, methodData]) => {
                const section = createElement('div', { classes: ['fhir-api-doc'] });
                const operationMainBlock = createElement('div', { classes: ['operation-block'], children: [
                    createElement('div', { classes: ['operation-block-summary'], children: [
                        createElement('div', {
                            classes: ['operation-block-summary-control'],
                            attributes: { 'aria-expanded': false },
                            children: [
                                createElement('span', { classes: ['operation-block-summary-method'], innerHTML: method.toUpperCase() }),
                                createElement('div', { classes: ['operation-block-summary-path'], innerHTML: methodData.base ? `${methodData.base}${path}` : path })
                            ]
                        })
                    ]
                    })
                ] });

                if (methodData.operationId) {
                    operationMainBlock.appendChild(createElement('div', { classes: ['operation-block-description'], innerHTML: `${window.fhirApiDocLabels.operationId_Label}: <b>${methodData.operationId}</b>` }));
                }
                if (methodData.description) {
                    operationMainBlock.appendChild(createElement('div', { classes: ['operation-block-description'], innerHTML: `${methodData.description}` }));
                }

                if (methodData.fhir) {
                    const fhirDetailsContainer = createElement('div');
                    operationMainBlock.appendChild(fhirDetailsContainer);
                    if (methodData.fhir.capabilityStatement) {
                        const capStmt = methodData.fhir.capabilityStatement;
                        const promise = capStmt.data ? Promise.resolve(capStmt.data) : loadData(capStmt.url);
                        promise.then(data => appendFhirDetails(parseFhirCapabilityStatement(data, capStmt.forResourceType), fhirDetailsContainer));
                    } else {
                        appendFhirDetails(methodData.fhir, fhirDetailsContainer);
                    }
                }

                if (methodData.requestExamples?.length) {
                    operationMainBlock.appendChild(createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.fhirApiDocLabels.requestExample_Header }));
                    appendExampleElements(methodData.requestExamples, operationMainBlock);
                }
                if (methodData.responses) {
                    operationMainBlock.appendChild(createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.fhirApiDocLabels.response_Header }));
                    const responseRows = methodData.responses.map(({ statusCode, description, errorCode, note }) => [statusCode, description, errorCode, note]);
                    operationMainBlock.appendChild(createElement('div', { classes: ['operation-block-description'], children: [createTable([
                        window.fhirApiDocLabels.response_StatusCode_Label,
                        window.fhirApiDocLabels.response_Description_Label,
                        window.fhirApiDocLabels.response_ErrorCode_Label,
                        window.fhirApiDocLabels.response_Note_Label
                    ], responseRows)] }));
                }
                if (methodData.responseExamples?.length) {
                    operationMainBlock.appendChild(createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.fhirApiDocLabels.responseExample_Header }));
                    appendExampleElements(methodData.responseExamples, operationMainBlock);
                }

                // Methodentyp
                switch (method.toUpperCase()) {
                    case 'GET':
                        operationMainBlock.classList.add('operation-block-get');
                        break;
                    case 'POST':
                        operationMainBlock.classList.add('operation-block-post');
                        break;
                    case 'PUT':
                        operationMainBlock.classList.add('operation-block-put');
                        break;
                    case 'DELETE':
                        operationMainBlock.classList.add('operation-block-delete');
                        break;
                }

                section.appendChild(operationMainBlock);
                container.appendChild(section);
            });
        });
    }
};

const parseFhirCapabilityStatement = (data, resourceType) => {
    const { rest: [{ resource = [] } = {}] = [] } = JSON.parse(data);
    const resourceDetails = resource.find(res => res.type === resourceType);
    if (!resourceDetails) {
        console.error(`${resourceType} not found!`);
        return {};
    }
    const translateExpectation = (expectation) => ({
        SHALL: window.fhirApiDocLabels.expectation_SHALL,
        SHOULD: window.fhirApiDocLabels.expectation_SHOULD,
        MAY: window.fhirApiDocLabels.expectation_MAY,
        OPTIONAL: window.fhirApiDocLabels.expectation_OPTIONAL,
    }[expectation] || expectation);

    return {
        searchParams: resourceDetails.searchParam?.map(({ name, definition, type, documentation = 'Keine Beschreibung', extension }) => ({
            name,
            definition,
            type,
            documentation,
            expectation: translateExpectation(extension?.find(ext => ext.url === "http://hl7.org/fhir/StructureDefinition/capabilitystatement-expectation")?.valueCode)
        })),
        searchInclude: resourceDetails.searchInclude,
        searchRevInclude: resourceDetails.searchRevInclude
    };
};
