
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


const createElement = (tag, { classes = [], attributes = {}, innerHTML = '', children = [] } = {}) => {
    const element = Object.assign(document.createElement(tag), { innerHTML });
    classes.forEach(cls => element.classList.add(cls));
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    children.forEach(child => element.appendChild(child));
    return element;
};


const createTable = (headers, rows, includeHeader = true, classes = []) => {
    const table = createElement('table', { attributes: { style: 'width: 100%' }, classes: classes });
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



export default {
    loadData,
    createElement,
    createTable
};