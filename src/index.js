import yaml from 'js-yaml';
const hljs = require('highlight.js/lib/core');
hljs.registerLanguage('xml', require('highlight.js/lib/languages/xml'));
hljs.registerLanguage('json', require('highlight.js/lib/languages/json'));


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


function renderApiExample(container, buttonContainer, example, data, exampleList, buttonList = []) {
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
    buttonContainer.appendChild(toggleButton);
    container.appendChild(exampleContainer);
}


function renderApiDocumentation(container, apiData) {
    if (apiData.paths) {
        Object.keys(apiData.paths).forEach((path) => {
            const pathData = apiData.paths[path];
            Object.keys(pathData).forEach((method) => {
                const methodData = pathData[method];
                const section = createElement('div', ['api-doc']);

                // Operation Block
                const operation = createElement('div', ['operation-block']);
                section.appendChild(operation);

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
                operation.appendChild(operationSummary);

                // Operation Description
                const operationDescription = createElement('div', ['operation-block-description']);
                if ('operationId' in methodData) {
                    const operationId = createElement('div', [], {}, `<p>OperationId: <b>${methodData.operationId}</b></p>`);
                    operationDescription.appendChild(operationId);
                }
                if ('description' in methodData) {
                    const description = createElement('div', [], {}, `<p>${methodData.description}</p>`);
                    operationDescription.appendChild(description);
                }
                operation.appendChild(operationDescription);

                // Search Parameters
                if ('searchParameters' in methodData) {
                    const searchParametersHeader = createElement('div', ['operation-block-section-header'], {}, 'Suchparameter');
                    operation.appendChild(searchParametersHeader);

                    const searchParametersRows = methodData.searchParameters.map(item => [
                        `<a href="${item.definition}" target="_blank">${item.name}</a>`,
                        `<code>${item.type}</code>`,
                        item.path,
                        item.conformance
                    ]);
                    const searchParametersTable = createTable(['Parameter', 'Type', 'Paths (Expression)', 'Anforderung'], searchParametersRows);
                    const searchParametersContainer = createElement('div', ['operation-block-description']);
                    searchParametersContainer.appendChild(searchParametersTable);
                    operation.appendChild(searchParametersContainer);
                }

                // Search Include and RevInclude Combined
                if ('searchInclude' in methodData || 'searchRevInclude' in methodData) {
                    const includeRevIncludeHeader = createElement('div', ['operation-block-section-header'], {}, 'Suche per Include und RevInclude');
                    operation.appendChild(includeRevIncludeHeader);

                    const includeRevIncludeRows = [];
                    const maxLength = Math.max(
                        methodData.searchInclude ? methodData.searchInclude.length : 0,
                        methodData.searchRevInclude ? methodData.searchRevInclude.length : 0
                    );

                    for (let i = 0; i < maxLength; i++) {
                        const include = methodData.searchInclude && methodData.searchInclude[i] ? methodData.searchInclude[i] : '';
                        const revInclude = methodData.searchRevInclude && methodData.searchRevInclude[i] ? methodData.searchRevInclude[i] : '';
                        includeRevIncludeRows.push([include, revInclude]);
                    }

                    const includeRevIncludeTable = createTable(['Include', 'RevInclude'], includeRevIncludeRows);
                    const includeRevIncludeContainer = createElement('div', ['operation-block-description']);
                    includeRevIncludeContainer.appendChild(includeRevIncludeTable);
                    operation.appendChild(includeRevIncludeContainer);
                }
                // Responses
                if ('responses' in methodData) {
                    const responsesHeader = createElement('div', ['operation-block-section-header'], {}, 'Antworten');
                    operation.appendChild(responsesHeader);

                    let isFirstResponse = true;
                    const responseContainer = createElement('div', ['operation-block-description']);
                    const responseTable = createElement('table', [], {});
                    const responseThead = createElement('thead');
                    const responseHeaderRow = createElement('tr');
                    const responseHeaders = ['Status Code', 'Beschreibung', 'Error Code', 'Bemerkung'];
                    responseHeaders.forEach(headerText => {
                        const th = createElement('th', [], {}, headerText);
                        responseHeaderRow.appendChild(th);
                    });
                    responseTable.appendChild(responseHeaderRow);
                    const responseTbody = createElement('tbody');
                    Object.keys(methodData.responses).forEach(statusCode => {
                        const response = methodData.responses[statusCode];
                        const rows = [[
                            statusCode,
                            response.description,
                            response.errorCode,
                            response.note
                        ]]
                        const row = createElement('tr');
                        rows.forEach(rowData => {
                            const row = createElement('tr');
                            rowData.forEach(cellData => {
                                const cell = createElement('td', [], {}, cellData);
                                row.appendChild(cell);
                            });
                            responseTbody.appendChild(row);
                        });
                        let exampleList = [];
                        if('examples' in response) {
                            const exampleButtonRow = createElement('tr');
                            const exampleButtonCell = createElement('td', ["example-buttons-container"], {colspan: `${rows[0].length}`});
                            exampleButtonRow.appendChild(exampleButtonCell);
                            responseTbody.appendChild(exampleButtonRow);
                            const row = createElement('tr');
                            const cell = createElement('td', [],{colspan: `${rows[0].length}; max-width: 100%;`});
                            response.examples.forEach(example => {
                                if('data' in example) {
                                    renderApiResponseExample(responseContainer, exampleButtonCell, example, example.data, exampleList, rows[0].length);
                                } else if('url' in example) {
                                    loadData(example.url).then(data => {
                                        renderApiResponseExample(responseContainer, exampleButtonCell, example, data, exampleList, rows[0].length);
                                    });
                                } else {
                                    return;
                                }
                                row.appendChild(cell);
                                responseTbody.append(row);
                            });
                        }
                        isFirstResponse = false;
                    });
                    responseTable.appendChild(responseTbody);
                    responseContainer.appendChild(responseTable);
                    operation.appendChild(responseContainer);
                }
                if('examples' in methodData) {
                    const examplesHeader = createElement('div', ['operation-block-section-header'], {}, 'Beispielantworten');
                    operation.appendChild(examplesHeader);

                    const examplesButtonContainer = createElement('div', ['operation-block-description']);
                    operation.appendChild(examplesButtonContainer);
                    const examplesContainer = createElement('div', ['operation-block-description', 'operation-example']);
                    operation.appendChild(examplesContainer);
                    let exampleList = [];
                    let exampleButtonList = [];
                    methodData.examples.forEach(example => {
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

                // Methodentyp
                switch (method.toUpperCase()) {
                    case 'GET':
                        operation.classList.add('operation-block-get');
                        operationSummary.classList.add('operation-block-summary-get');
                        break;
                    case 'POST':
                        operation.classList.add('operation-block-post');
                        operationSummary.classList.add('operation-block-summary-post');
                        break;
                    case 'PUT':
                        operation.classList.add('operation-block-put');
                        operationSummary.classList.add('operation-block-summary-put');
                        break;
                    case 'DELETE':
                        operation.classList.add('operation-block-delete');
                        operationSummary.classList.add('operation-block-summary-delete');
                        break;
                }

                container.appendChild(section);
            });
        });
    }
}




