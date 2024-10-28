import yaml from 'js-yaml';
const hljs = require('highlight.js/lib/core');
hljs.registerLanguage('xml', require('highlight.js/lib/languages/xml'));
hljs.registerLanguage('json', require('highlight.js/lib/languages/json'));


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
    operationId_Label: "OperationId"
};


document.addEventListener("DOMContentLoaded", function () {
    const apiDocs = document.querySelectorAll('fhir-api-doc');
    apiDocs.forEach(apiDoc => {
        const script = apiDoc.querySelector('script[type="text/yaml"]');
        if (script) {
            const yamlText = script.textContent;
            const parsedYaml = yaml.load(yamlText);
            renderApiDocumentation(apiDoc, parsedYaml);
        }
    });
});


function createElement(tag, classes = [], attributes = {}, innerHTML = '') {
    const element = document.createElement(tag);
    classes.forEach(cls => element.classList.add(cls));
    for (const key in attributes) {
        element.setAttribute(key, attributes[key]);
    }
    if (innerHTML) {
        element.innerHTML = innerHTML;
    }
    return element;
}


function createTable(headers, rows, includeHeader = true) {
    const table = createElement('table', [], { style: 'width: 100%' });
    if (includeHeader) {
        const thead = createElement('thead');
        const headerRow = createElement('tr');
        headers.forEach(headerText => {
            const th = createElement('th', [], {}, headerText);
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
    }
    const tbody = createElement('tbody');
    rows.forEach(rowData => {
        const row = createElement('tr');
        rowData.forEach(cellData => {
            const cell = createElement('td', [], {}, cellData);
            row.appendChild(cell);
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    return table;
}


async function loadData(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error(error.message);
    }
    return "";
}


function renderApiExample(parent, buttonParent, example, data, exampleList, buttonList = []) {
    let exampleContainer = createElement('span', [], {});
    switch (example.type.toUpperCase()) {
        case 'JSON':
            exampleContainer = createElement('pre', [], {});
            const jsonString = JSON.stringify(JSON.parse(data),null,2);
            const highlightedJsonCode = hljs.highlight(
                jsonString,
                { language: 'json' }
              ).value
            let codeJson = createElement('code', [], {},  highlightedJsonCode);
            exampleContainer.appendChild(codeJson);
            break;
        case 'XML':
            exampleContainer = createElement('pre', [], {});
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, "application/xml");
            const serializer = new XMLSerializer();
            const xmlString = serializer.serializeToString(xmlDoc);
            const highlightedXMLCode = hljs.highlight(
                xmlString,
                { language: 'xml' }
              ).value
            let codeXML = createElement('code', [], {},  highlightedXMLCode);
            exampleContainer.appendChild(codeXML);
            break;
        case 'HTML':
            exampleContainer.innerHTML = data;
            break;
        case 'TXT':
            exampleContainer.textContent = data;
            break;
    }
    exampleContainer.style.display = 'none';
    exampleList.push(exampleContainer);
    const toggleButton = createElement('button', ["example", "inline-button"], {});
    const buttonLabel = createElement('span', ["label"], {}, example.type.toUpperCase());
    const buttonTest = createElement('span', [], {}, example.name);
    toggleButton.appendChild(buttonLabel);
    toggleButton.appendChild(buttonTest);
    toggleButton.addEventListener('click', () => {
        exampleList.forEach(elem => {
            if(elem != exampleContainer) {
                elem.style.display = 'none';
            }
        });
        buttonList.forEach(elem => {
            elem.classList.remove('active-button');
        });
        if(exampleContainer.style.display == 'none') {
            exampleContainer.style.display = 'block';
            toggleButton.classList.add('active-button');
        } else {
            exampleContainer.style.display = 'none';
        }
    });
    buttonList.push(toggleButton);
    buttonParent.appendChild(toggleButton);
    parent.appendChild(exampleContainer);
}


function addExampleElements(exampleData, container) {
    const examplesButtonContainer = createElement('div', ['operation-block-description']);
    container.appendChild(examplesButtonContainer);
    const examplesContainer = createElement('div', ['operation-block-description', 'operation-example']);
    container.appendChild(examplesContainer);
    let exampleList = [];
    let exampleButtonList = [];
    exampleData.forEach(example => {
        if('data' in example) {
            renderApiExample(examplesContainer, examplesButtonContainer, example, example.data, exampleList, exampleButtonList);
        } else if('url' in example) {
            loadData(example.url).then(data => {
                renderApiExample(examplesContainer, examplesButtonContainer, example, data, exampleList, exampleButtonList);

            });
        } else {
            return;
        }
    });
}

function appendFhirDetails(fhirData, parent) {
    // Search Parameters
    if (fhirData.searchParams && fhirData.searchParams.length >0) {
        const searchParametersHeader = createElement('div', ['operation-block-section-header'], {}, window.fhirApiDocLabels.searchParams_Header);
        parent.appendChild(searchParametersHeader);

        const searchParametersRows = fhirData.searchParams.map(item => [
            `<a href="${item.definition}" target="_blank">${item.name}</a>`,
            `<code>${item.type}</code>`,
            item.documentation,
            item.expectation
        ]);
        const cellTitles = [
            window.fhirApiDocLabels.searchParams_Parameter_Label,
            window.fhirApiDocLabels.searchParams_Type_Label,
            window.fhirApiDocLabels.searchParams_Documentation_Label,
            window.fhirApiDocLabels.searchParams_Expectation_Label
        ];
        const searchParametersTable = createTable(cellTitles, searchParametersRows);
        const searchParametersContainer = createElement('div', ['operation-block-description']);
        searchParametersContainer.appendChild(searchParametersTable);
        parent.appendChild(searchParametersContainer);
    }

    // Search Include and RevInclude Combined
    if (fhirData.searchInclude || fhirData.searchRevInclude) {
        const includeRevIncludeHeader = createElement('div', ['operation-block-section-header'], {}, window.fhirApiDocLabels.searchInclude_And_RevInclude_Header);
        parent.appendChild(includeRevIncludeHeader);

        const includeRevIncludeRows = [];
        const maxLength = Math.max(
            fhirData.searchInclude ? fhirData.searchInclude.length : 0,
            fhirData.searchRevInclude ? fhirData.searchRevInclude.length : 0
        );

        for (let i = 0; i < maxLength; i++) {
            const include = fhirData.searchInclude && fhirData.searchInclude[i] ? fhirData.searchInclude[i] : '';
            const revInclude = fhirData.searchRevInclude && fhirData.searchRevInclude[i] ? fhirData.searchRevInclude[i] : '';
            includeRevIncludeRows.push([include, revInclude]);
        }

        const includeRevIncludeTable = createTable(['Include', 'RevInclude'], includeRevIncludeRows);
        const includeRevIncludeContainer = createElement('div', ['operation-block-description']);
        includeRevIncludeContainer.appendChild(includeRevIncludeTable);
        parent.appendChild(includeRevIncludeContainer);
    }
}


function renderApiDocumentation(container, apiData) {
    if (apiData.paths) {
        Object.keys(apiData.paths).forEach((path) => {
            const pathData = apiData.paths[path];
            Object.keys(pathData).forEach((method) => {
                const methodData = pathData[method];
                const section = createElement('div', ['fhir-api-doc']);

                // Operation Block
                const operationMainBlock = createElement('div', ['operation-block']);
                section.appendChild(operationMainBlock);

                // Operation Summary
                const operationSummary = createElement('div', ['operation-block-summary']);
                const operationSummaryControl = createElement('button', ['operation-block-summary-control'], {
                    'aria-expanded': false
                });
                const operationSummaryMethod = createElement('span', ['operation-block-summary-method'], {}, method.toUpperCase());
                operationSummaryControl.appendChild(operationSummaryMethod);

                const pathTextContent = 'base' in methodData ? `${methodData.base}${path}` : path;
                const operationSummaryPath = createElement('div', ['operation-block-summary-path'], {}, pathTextContent);
                operationSummaryControl.appendChild(operationSummaryPath);

                operationSummary.appendChild(operationSummaryControl);
                operationMainBlock.appendChild(operationSummary);

                // Operation Description
                const operationDescription = createElement('div', ['operation-block-description']);
                if (methodData.operationId) {
                    const operationId = createElement('div', [], {}, `<p>${window.fhirApiDocLabels.operationId_Label}: <b>${methodData.operationId}</b></p>`);
                    operationDescription.appendChild(operationId);
                }
                if (methodData.description) {
                    const description = createElement('div', [], {}, `<p>${methodData.description}</p>`);
                    operationDescription.appendChild(description);
                }
                operationMainBlock.appendChild(operationDescription);

                if(methodData.fhir) {
                    const fhirDetailsConatiner = createElement('div', [], {});
                    operationMainBlock.appendChild(fhirDetailsConatiner);
                    const fhirData = methodData.fhir;
                    if (fhirData.capabilityStatement) {
                        if(fhirData.capabilityStatement.data) {
                            const parsedFhirData = parseFhirCapabilityStatement(fhirData.capabilityStatement.data, fhirData.capabilityStatement.forResourceType);
                            appendFhirDetails(parsedFhirData, fhirDetailsConatiner);
                        } else if(fhirData.capabilityStatement.url) {
                            loadData(fhirData.capabilityStatement.url).then(data => {
                                const parsedFhirData = parseFhirCapabilityStatement(data, fhirData.capabilityStatement.forResourceType);
                                appendFhirDetails(parsedFhirData, fhirDetailsConatiner);
                            });
                        }
                    } else {
                        appendFhirDetails(fhirData, fhirDetailsConatiner);
                    }
                }
                if(methodData.requestExamples && methodData.requestExamples.length >0) {
                    const examplesRequestHeader = createElement('div', ['operation-block-section-header'], {}, window.fhirApiDocLabels.requestExample_Header);
                    operationMainBlock.appendChild(examplesRequestHeader);
                    addExampleElements(methodData.requestExamples, operationMainBlock);
                }
                // Responses
                if (methodData.responses) {
                    const responsesHeader = createElement('div', ['operation-block-section-header'], {}, window.fhirApiDocLabels.response_Header);
                    operationMainBlock.appendChild(responsesHeader);

                    let isFirstResponse = true;
                    const responseContainer = createElement('div', ['operation-block-description']);
                    const responseTable = createElement('table', [], {style: 'width: 100%;'});
                    const responseThead = createElement('thead');
                    const responseHeaderRow = createElement('tr');
                    const responseHeaders = [
                        window.fhirApiDocLabels.response_StatusCode_Label, 
                        window.fhirApiDocLabels.response_Description_Label, 
                        window.fhirApiDocLabels.response_ErrorCode_Label, 
                        window.fhirApiDocLabels.response_Note_Label
                    ];
                    responseHeaders.forEach(headerText => {
                        const th = createElement('th', [], {}, headerText);
                        responseHeaderRow.appendChild(th);
                    });
                    responseThead.appendChild(responseHeaderRow);
                    responseTable.appendChild(responseThead);
                    const responseTbody = createElement('tbody');
                    methodData.responses.forEach(item => {
                        const rowData = [
                            item.statusCode,
                            item.description,
                            item.errorCode,
                            item.note
                        ];
                        const row = createElement('tr');
                        rowData.forEach(cellData => {
                            const cell = createElement('td', [], {}, cellData);
                            row.appendChild(cell);
                        });
                        responseTbody.appendChild(row);
                    });
                    responseTable.appendChild(responseTbody);
                    responseContainer.appendChild(responseTable);
                    operationMainBlock.appendChild(responseContainer);
                }
                if(methodData.responseExamples && methodData.responseExamples.length >0) {
                    const examplesHeader = createElement('div', ['operation-block-section-header'], {}, window.fhirApiDocLabels.responseExample_Header);
                    operationMainBlock.appendChild(examplesHeader);
                    addExampleElements(methodData.responseExamples, operationMainBlock);
                }

                // Methodentyp
                switch (method.toUpperCase()) {
                    case 'GET':
                        operationMainBlock.classList.add('operation-block-get');
                        operationSummary.classList.add('operation-block-summary-get');
                        break;
                    case 'POST':
                        operationMainBlock.classList.add('operation-block-post');
                        operationSummary.classList.add('operation-block-summary-post');
                        break;
                    case 'PUT':
                        operationMainBlock.classList.add('operation-block-put');
                        operationSummary.classList.add('operation-block-summary-put');
                        break;
                    case 'DELETE':
                        operationMainBlock.classList.add('operation-block-delete');
                        operationSummary.classList.add('operation-block-summary-delete');
                        break;
                }

                container.appendChild(section);
            });
        });
    }
}


function parseFhirCapabilityStatement(data, resourceType) {
    const capabilityStatement = JSON.parse(data);
    const resources = capabilityStatement.rest?.[0]?.resource || [];
    const resource = resources.find(res => res.type === resourceType);

    if (!resource) {
        console.error(`${resourceType} not found!`);
        return {};
    }

    let details = {};

    // Funktion zur Übersetzung der expectation-Werte
    function translateExpectation(expectation) {
        const translations = {
            "SHALL": "MUSS",
            "SHOULD": "SOLLTE",
            "MAY": "DARF",
            "OPTIONAL": "OPTIONAL"
        };
        return translations[expectation] || expectation;
    }

    // Suchparameter hinzufügen
    if (resource.searchParam && resource.searchParam.length > 0) {
        details.searchParams = resource.searchParam.map(param => {
            const expectationExtension = param.extension?.find(ext => ext.url === "http://hl7.org/fhir/StructureDefinition/capabilitystatement-expectation");
            const searchParamDetail = {
                name: param.name,
                definition: param.definition,
                type: param.type,
                documentation: param.documentation || 'Keine Beschreibung',
            };
            if (expectationExtension) {
                searchParamDetail.expectation = translateExpectation(expectationExtension.valueCode);
            }
            return searchParamDetail;
        });
    }

    if(resource.searchInclude && resource.searchInclude.length >0 ) {
        details.searchInclude = [...resource.searchInclude];
    }
    if(resource.searchRevInclude && resource.searchRevInclude.length >0 ) {
        details.searchRevInclude = [...resource.searchRevInclude];
    }
    return details;
}




