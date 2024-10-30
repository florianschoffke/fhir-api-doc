import jsyaml from 'js-yaml';
import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';

hljs.registerLanguage('xml', xml);
hljs.registerLanguage('json', json);

// Global variables for labels
window.fhirApiDocLabels = window.fhirApiDocLabels || {
    ContentTypes_Label: "Content Types",
    HeaderParams_Header: "HTTP Header Parameters",
    Parameter_Label: "Parameter",
    Type_Label: "Type",
    Expectation_Label: "Requirement",
    Description_Label: "Description",
    SearchParams_Header: "Search Parameters",
    Documentation_Label: "Description",
    Response_Header: "Status Codes",
    StatusCode_Label: "Status Code",
    ErrorCode_Label: "Error Code",
    Note_Label: "Note",
    SearchInclude_And_RevInclude_Header: "Search with Include and RevInclude",
    RequestExample_Header: "Request Example",
    ResponseExample_Header: "Response Examples",
    OperationId_Label: "OperationId",
    Expectation_SHALL: "MUST",
    Expectation_SHOULD: "SHOULD",
    Expectation_MAY: "MAY",
    Expectation_OPTIONAL: "OPTIONAL"

};


document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('fhir-api-doc').forEach(apiDoc => {
        // Process YAML data from the <fhir-api-doc>
        const yamlList = parseYAMLFromFHIRApiDoc(apiDoc);
        const finalConfig = loadYAMLWithIncludes(yamlList);

        if (finalConfig) {
            renderApiDocumentation(apiDoc, finalConfig);
        } else {
            console.error('Error creating the configuration');
        }
    });
});

// Extract YAML from the fhir-api-doc tag
function parseYAMLFromFHIRApiDoc(apiDocElement) {
    if (!apiDocElement) {
        console.error("fhir-api-doc tag not found");
        return [];
    }

    // Get all <script type="text/yaml"> within the document by id if it is included
    const scriptTags = Array.from(apiDocElement.querySelectorAll('script[type="text/yaml"]'));
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
                if (obj[key].include) {
                    const baseKey = obj[key].include;
                    const baseScript = document.querySelector(baseKey);
                    if (!baseScript) {
                        console.error(`Include key ${baseKey} not found`);
                        continue;
                    }
                    try {
                        const baseData = jsyaml.load(baseScript.textContent) || {};
                        // Only include the data specified by the include key
                        obj[key] = mergeObjects(baseData, obj[key]);
                    } catch (error) {
                        console.error(`Error loading base YAML from include key ${baseKey}:`, error);
                        continue;
                    }
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
        parent.appendChild(createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.fhirApiDocLabels.SearchParams_Header }));
        const searchParametersRows = fhirData.searchParams.map(({ name, definition, type, documentation, expectation }) => [
            `<a href="${definition}" target="_blank">${name}</a>`,
            `<code>${type}</code>`,
            documentation,
            expectation
        ]);
        parent.appendChild(createElement('div', { classes: ['operation-block-description', 'with-table'], children: [createTable([
            window.fhirApiDocLabels.Parameter_Label,
            window.fhirApiDocLabels.Type_Label,
            window.fhirApiDocLabels.Documentation_Label,
            window.fhirApiDocLabels.Expectation_Label
        ], searchParametersRows)] }));
    }

    if (fhirData.searchInclude || fhirData.searchRevInclude) {
        parent.appendChild(createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.fhirApiDocLabels.SearchInclude_And_RevInclude_Header }));
        const rows = Array.from({ length: Math.max(fhirData.searchInclude?.length || 0, fhirData.searchRevInclude?.length || 0) }, (_, i) => [
            fhirData.searchInclude?.[i] || '',
            fhirData.searchRevInclude?.[i] || ''
        ]);
        parent.appendChild(createElement('div', { classes: ['operation-block-description', 'with-table'], children: [createTable(['Include', 'RevInclude'], rows)] }));
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
                const section = createElement('div', { classes: ['fhir-api-doc'] });
                const operationMainBlock = createElement('div', { classes: ['operation-block'], children: [
                    createElement('div', { classes: ['operation-block-summary'], children: [
                        createElement('div', {
                            classes: ['operation-block-summary-control'],
                            attributes: { 'aria-expanded': false },
                            children: [
                                createElement('span', { classes: ['operation-block-summary-method'], innerHTML: method.toUpperCase() }),
                                createElement('div', { classes: ['operation-block-summary-path'], innerHTML: apiData.base ? `${apiData.base}${path}` : path })
                            ]
                        })
                    ]
                    })
                ] });
                let withLowPadding = false;
                if (methodData.operationId) {
                    operationMainBlock.appendChild(createElement('div', { classes: ['operation-block-description'], innerHTML: `${window.fhirApiDocLabels.OperationId_Label}: <b>${methodData.operationId}</b>` }));
                    withLowPadding = true;
                }

                if (methodData.contentTypes?.length) {
                    const contentTypeHtml= methodData.contentTypes.map(value => `<b>${value}</b>`);
                    let classesContentType = ['operation-block-description'];
                    if (withLowPadding) {
                        classesContentType.push('low-padding');
                    }
                    operationMainBlock.appendChild(createElement('div', { classes: classesContentType, innerHTML: `${window.fhirApiDocLabels.ContentTypes_Label}: <b>${contentTypeHtml.join(", ")}</b>` }));

                }

                if (methodData.description) {
                    operationMainBlock.appendChild(createElement('div', { classes: ['operation-block-description'], innerHTML: `${methodData.description}` }));
                }
                
                if (methodData.headerParams?.length) {
                    operationMainBlock.appendChild(createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.fhirApiDocLabels.HeaderParams_Header }));
                    const headerParamsRows = methodData.headerParams.map(({ name, type, description, expectation }) => [
                        name,
                        `<code>${type}</code>`, 
                        description, 
                        expectation
                    ]);
                    operationMainBlock.appendChild(createElement('div', { classes: ['operation-block-description', 'with-table'], children: [createTable([
                        window.fhirApiDocLabels.Parameter_Label,
                        window.fhirApiDocLabels.Type_Label,
                        window.fhirApiDocLabels.Expectation_Label,
                        window.fhirApiDocLabels.Description_Label
                    ], headerParamsRows)] }));
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
                    operationMainBlock.appendChild(createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.fhirApiDocLabels.RequestExample_Header }));
                    appendExampleElements(methodData.requestExamples, operationMainBlock);
                }
                if (methodData.responses) {
                    operationMainBlock.appendChild(createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.fhirApiDocLabels.Response_Header }));
                    const responseRows = methodData.responses.map(({ statusCode, description, errorCode, note }) => [
                        `<code>${statusCode}</code>`, 
                        description, 
                        errorCode, 
                        note
                    ]);
                    operationMainBlock.appendChild(createElement('div', { classes: ['operation-block-description', 'with-table'], children: [createTable([
                        window.fhirApiDocLabels.StatusCode_Label,
                        window.fhirApiDocLabels.Description_Label,
                        window.fhirApiDocLabels.ErrorCode_Label,
                        window.fhirApiDocLabels.Note_Label
                    ], responseRows)] }));
                }
                if (methodData.responseExamples?.length) {
                    operationMainBlock.appendChild(createElement('div', { classes: ['operation-block-section-header'], innerHTML: window.fhirApiDocLabels.ResponseExample_Header }));
                    appendExampleElements(methodData.responseExamples, operationMainBlock);
                }

                // Method type
                operationMainBlock.classList.add(`operation-block-${method.toLowerCase()}`);
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
        SHALL: window.fhirApiDocLabels.Expectation_SHALL,
        SHOULD: window.fhirApiDocLabels.Expectation_SHOULD,
        MAY: window.fhirApiDocLabels.Expectation_MAY,
        OPTIONAL: window.fhirApiDocLabels.Expectation_OPTIONAL,
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
};
