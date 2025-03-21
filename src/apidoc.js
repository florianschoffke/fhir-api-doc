import jsyaml from 'js-yaml';
import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';

import fhir from './fhir.js';
import utils from './utils.js';

hljs.registerLanguage('xml', xml);
hljs.registerLanguage('json', json);

// Global variables for labels
window.gemIGApiDocLabels = window.gemIGApiDocLabels || {
    ContentTypes_Label: "Content Types",
    HeaderParams_Header: "HTTP Header-Parameter",
    Parameter_Label: "Parameter",
    Type_Label: "Type",
    Expectation_Label: "Service Anforderung",
    Description_Label: "Beschreibung",
    SearchParams_Header: "Suchparameter",
    Documentation_Label: "Beschreibung",
    Response_Header: "Antwort Status-Codes",
    StatusCode_Label: "Code",
    ErrorCode_Label: "Error Code",
    Note_Label: "Beschreibung",
    SearchInclude_And_RevInclude_Header: "Suche per Include oder RevInclude",
    RequestExample_Header: "Beispielanfragen",
    ResponseExample_Header: "Beispielantworten",
    OperationId_Label: "OperationId",
    Expectation_SHALL: "MUSS",
    Expectation_SHOULD: "KANN",
    Expectation_SHOULD_NOT: "DARF NICHT",
    Expectation_MAY: "OPTIONAL",
    Copy_Button_Label: "Code kopieren",
    Copied_Button_Label: "Code wird kopiert"
};


document.addEventListener("DOMContentLoaded", () => {
    renderAllApiDocumentations();
});


function renderAllApiDocumentations() {
    document.querySelectorAll('gem-ig-api-doc').forEach(apiDoc => {
        // Process YAML data from the <fhir-api-doc>
        const yamlList = parseYAMLFromFHIRApiDoc(apiDoc);
        const finalConfig = loadYAMLWithIncludes(yamlList);

        if (finalConfig) {
            renderApiDocumentation(apiDoc, finalConfig);
        } else {
            console.error('Error creating the configuration');
        }
    });
}

// Extract YAML from the fhir-api-doc tag
function parseYAMLFromFHIRApiDoc(apiDocElement) {
    if (!apiDocElement) {
        console.error("gem-ig-api-doc tag not found");
        return [];
    }

    // Get all <script type="text/yaml"> within the document by id if it is included
    // const scriptTags = Array.from(apiDocElement.querySelectorAll('script[type="text/yaml"]'));
    const scriptTags = Array.from(apiDocElement.querySelectorAll('textarea[data-apidoc-data="yaml"]'));
    return scriptTags.map(script => {
        try {
            return {
                id: script.id ? `#${script.id}` : null,
                content: jsyaml.load(script.textContent)
            };
        } catch (error) {
            console.error(`Error parsing YAML in script tag ${script.id ? script.id : 'without ID'}:`, error);
            return {
                id: script.id ? `#${script.id}` : null,
                content: null
            };
        }
    });
}

// Function to merge YAML objects
function mergeObjects(base, derived) {
    if (!base) return derived;

    const result = Array.isArray(base) ? [...base] : { ...base };

    for (const key in derived) {
        if (Array.isArray(base[key]) && Array.isArray(derived[key])) {
            // Merge arrays while avoiding duplicates
            result[key] = [...base[key], ...derived[key].filter(item => !base[key].some(baseItem => baseItem.name === item.name))];
        } else if (typeof derived[key] === 'object' && !Array.isArray(derived[key]) && key in base) {
            result[key] = mergeObjects(base[key], derived[key]);
        } else {
            result[key] = derived[key];
        }
    }
    return result;
}

// Function to process YAML data, including generic include logic
function loadYAMLWithIncludes(yamlList) {
    const yamlMap = Object.fromEntries(yamlList.filter(item => item.id).map(item => [item.id, item.content]));

    function processIncludes(obj) {
        for (const key in obj) {
            if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                if (obj[key].include && Array.isArray(obj[key].include)) {
                    obj[key].include.forEach(baseKey => {
                        const baseScript = document.querySelector(baseKey);
                        if (!baseScript) {
                            console.error(`Include key ${baseKey} not found`);
                            return;
                        }
                        try {
                            const baseData = jsyaml.load(baseScript.textContent) || {};
                            // Only include the data specified by the include key
                            obj[key] = mergeObjects(baseData, obj[key]);
                        } catch (error) {
                            console.error(`Error loading base YAML from include key ${baseKey}:`, error);
                            return;
                        }
                    });
                    delete obj[key].include; // Remove the include key after merging
                }
                processIncludes(obj[key]); // Continue recursively
            }
        }
    }

    yamlList.forEach(dataItem => {
        if (dataItem.content) {
            processIncludes(dataItem.content);
        } else {
            console.error(`YAML content for ${dataItem.id} is null or undefined`);
        }
    });

    // Merge all YAML objects
    return yamlList.reduce((acc, item) => mergeObjects(acc, item.content), {});
}


const createCopyButton = (data, language = null) => {
    const wrapper = utils.createElement('div', { classes: ['gem-ig-copy-container'] });
    const languageElement = utils.createElement('span', { classes: ['gem-id-code-lang'] })
    if (language) {
        languageElement.innerText = language.toLowerCase();
    }
    // The Copy Button
    const buttonWrapper = utils.createElement('div', { classes: ['gem-ig-copy-button-wrapper'] });
    const button = utils.createElement('button', { innerHTML: window.gemIGApiDocLabels.Copy_Button_Label});
    // Add click event listener to copy button
    button.addEventListener('click', function () {
        navigator.clipboard.writeText(data).then(() => {
            button.innerText = window.gemIGApiDocLabels.Copied_Button_Label;
            setTimeout(() => button.innerText = window.gemIGApiDocLabels.Copy_Button_Label, 2000);
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

const appendFhirDetails = (fhirData, parent) => {
    if (fhirData.searchParams?.length) {
        parent.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.gemIGApiDocLabels.SearchParams_Header }));
        const searchParametersRows = fhirData.searchParams.map(({ name, definition, type, documentation, expectation }) => [
            // definition ? `<a href="${definition}" target="_blank">${name}</a>` : name,
            name,
            `<code>${type}</code>`,
            documentation,
            expectation
        ]);
        parent.appendChild(utils.createElement('div', { classes: ['operation-block-description', 'with-table'], children: [utils.createTable([
            window.gemIGApiDocLabels.Parameter_Label,
            window.gemIGApiDocLabels.Type_Label,
            window.gemIGApiDocLabels.Documentation_Label,
            window.gemIGApiDocLabels.Expectation_Label
        ], searchParametersRows, true, ['params-table'])] }));
    }

    if (fhirData.searchInclude || fhirData.searchRevInclude) {
        parent.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.gemIGApiDocLabels.SearchInclude_And_RevInclude_Header }));
        const rows = Array.from({ length: Math.max(fhirData.searchInclude?.length || 0, fhirData.searchRevInclude?.length || 0) }, (_, i) => [
            fhirData.searchInclude?.[i] || '',
            fhirData.searchRevInclude?.[i] || ''
        ]);
        parent.appendChild(utils.createElement('div', { classes: ['operation-block-description', 'with-table'], children: [utils.createTable(['Include', 'RevInclude'], rows)] }));
    }
};

const renderApiDocumentation = (container, apiData) => {
    const httpMethods = ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'HEAD'];
    if (apiData.paths) {
        Object.entries(apiData.paths).forEach(([path, pathData]) => {
            Object.entries(pathData).forEach(([method, methodData]) => {
                if (!httpMethods.includes(method.toUpperCase())) {
                    console.log(`${method.toUpperCase()} is not a valid HTTP method. Skipping to next.`);
                    return;
                }
                const section = utils.createElement('div', { classes: ['gem-ig-api-doc'] });
                const operationMainBlock = utils.createElement('div', { classes: ['operation-block'], children: [
                    utils.createElement('div', { classes: ['operation-block-summary'], children: [
                        utils.createElement('div', {
                            classes: ['operation-block-summary-control'],
                            attributes: { 'aria-expanded': false },
                            children: [
                                utils.createElement('span', { classes: ['operation-block-summary-method'], innerHTML: method.toUpperCase() }),
                                utils.createElement('div', { classes: ['operation-block-summary-path'], innerHTML: apiData.base ? `${apiData.base}${path}` : path })
                            ]
                        })
                    ]
                    })
                ] });
                let withLowPadding = false;
                if (methodData.operationId) {
                    operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-description'], innerHTML: `${window.gemIGApiDocLabels.OperationId_Label}: <b>${methodData.operationId}</b>` }));
                    withLowPadding = true;
                }

                if (methodData.contentTypes?.length) {
                    const contentTypeHtml= methodData.contentTypes.map(value => `<b>${value}</b>`);
                    let classesContentType = ['operation-block-description'];
                    if (withLowPadding) {
                        classesContentType.push('low-padding');
                    }
                    operationMainBlock.appendChild(utils.createElement('div', { classes: classesContentType, innerHTML: `${window.gemIGApiDocLabels.ContentTypes_Label}: <b>${contentTypeHtml.join(", ")}</b>` }));

                }

                if (methodData.description) {
                    operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-description'], innerHTML: `${methodData.description}` }));
                }
                
                if (methodData.headerParams?.length) {
                    operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.gemIGApiDocLabels.HeaderParams_Header }));
                    const headerParamsRows = methodData.headerParams.map(({ name, type, description, expectation }) => [
                        name,
                        `<code>${type}</code>`, 
                        description, 
                        expectation
                    ]);
                    operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-description', 'with-table'], children: [utils.createTable([
                        window.gemIGApiDocLabels.Parameter_Label,
                        window.gemIGApiDocLabels.Type_Label,
                        window.gemIGApiDocLabels.Description_Label,
                        window.gemIGApiDocLabels.Expectation_Label
                    ], headerParamsRows, true, ['params-table'])] }));
                }

                if (methodData.fhir) {
                    const fhirDetailsContainer = utils.createElement('div');
                    operationMainBlock.appendChild(fhirDetailsContainer);
                    if (methodData.fhir.capabilityStatement) {
                        const capStmt = methodData.fhir.capabilityStatement;
                        const promise = capStmt.data ? Promise.resolve(capStmt.data) : utils.loadData(capStmt.url);
                        promise.then(data => appendFhirDetails(fhir.parseFhirCapabilityStatement(data, capStmt.forResourceType), fhirDetailsContainer));
                    } else {
                        appendFhirDetails(methodData.fhir, fhirDetailsContainer);
                    }
                }

                if (methodData.requestExamples?.length) {
                    operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.gemIGApiDocLabels.RequestExample_Header }));
                    appendExampleElements(methodData.requestExamples, operationMainBlock);
                }

                if (methodData.responseExamples?.length) {
                    operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.gemIGApiDocLabels.ResponseExample_Header }));
                    appendExampleElements(methodData.responseExamples, operationMainBlock);
                }

                if (methodData.responses) {
                    operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.gemIGApiDocLabels.Response_Header }));
                    const responseRows = methodData.responses.map(({ statusCode, description, errorCode, note }) => [
                        `<code>${statusCode}</code>`, 
                        description, 
                        errorCode, 
                        note
                    ]);
                    operationMainBlock.appendChild(utils.createElement('div', { classes: ['operation-block-description', 'with-table'], children: [utils.createTable([
                        window.gemIGApiDocLabels.StatusCode_Label,
                        window.gemIGApiDocLabels.Description_Label,
                        window.gemIGApiDocLabels.ErrorCode_Label,
                        window.gemIGApiDocLabels.Note_Label
                    ], responseRows)] }));
                }

                // Method type
                operationMainBlock.classList.add(`operation-block-${method.toLowerCase()}`);
                section.appendChild(operationMainBlock);
                container.appendChild(section);
            });
        });
    }
};
