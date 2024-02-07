window.addEventListener('DOMContentLoaded', () => {
    const lists_container = (document.querySelector('section.lists'))

    // Process each list and its items from the URL query string
    const lists = getLists()

    if (lists.length === 0) {
        const no_lists = document.createElement('p')
        no_lists.classList.add('no-lists')
        no_lists.appendChild(document.createTextNode('No lists.'))
        lists_container.appendChild(no_lists)
    }

    // An initial _New List_ field should be after a "No lists" message, but
    // before any lists
    const add_new_list_block = addNewListField(lists_container)

    // Build each list from the query parameters' data
    lists.forEach((list) => {
        const list_block = addList({
            container: lists_container,
            heading: list.name,
        })

        if (list.items !== null) {
            addItems({
                values: list.items,
                checks: list.checks ?? '',
                list_block
            })
        } else {
            addNoItemsMessage(list_block)
        }
    })
})

function addItems({values, checks, list_block}) {
    const params = new URLSearchParams(window.location.search)
    const list_id = list_block.getAttribute('id')
    const tc = document.querySelector('.list-template').content

    // Use an existing list or create a new one
    const list_list = (function() {
        const existing_list_list = list_block.querySelector('ul, ol')

        if (existing_list_list !== null) return existing_list_list

        const type = params.get(list_id + 'type')

        const list_list = tc.querySelector(type).cloneNode()
        list_block.appendChild(list_list)

        addNewItemField(list_block)

        return list_list
    })()

    const items = Array.from(list_list.querySelectorAll('li'))

    // If the list didn't have any items yet, add the "No items." message.
    if (items.length === 0) {
        list_block.querySelector('.no-items').remove()
    }

    // Add the items
    values.split(',').forEach((value, index) => {
        const decoded_value = decodeURIComponent(value)
        // Create the new item.
        const item = tc.querySelector('li').cloneNode(true)
        const item_id_number = items.length + index + 1
        const item_id = list_id + '-' + item_id_number

        // Set up the checkbox.
        const checkbox = item.querySelector('input[type=checkbox]')
        checkbox.setAttribute('value', value)
        checkbox.setAttribute('name', item_id)
        checkbox.setAttribute('id', item_id)

        const check = checks.substring(index, index + 1)

        if (check === '1') {
            checkbox.setAttribute('checked', 'checked')
        } else {
            checkbox.removeAttribute('checked')
        }

        //checkbox.removeAttribute('checked')
        checkbox.addEventListener('change', updateCheck)

        // Set up the label.
        /* Since we _deep_ cloned the template list item, we replace the
         * `innerText` rather than just appending `document.createTextNode`.
         */
        const label = item.querySelector('label')
        label.setAttribute('for', item_id)
        label.innerText = decoded_value

        // Add the new item to the page.
        list_list.appendChild(item)

        // Add the new item to the list of items.
        items.push(item)
    })

    // Use the list of items to update the query parameter values.
    const param = {
        items: [],
        checks: []
    }

    items.forEach((item) => {
        const checkbox = item.querySelector('input[type=checkbox]')
        param.items.push(checkbox.value)
        param.checks.push(checkbox.checked ? '1' : '0')
    })

    params.set(list_id + 'items', param.items.join(','))
    params.set(list_id + 'checks', param.checks.join(''))

    setUrl(params)
}

function addItemHandler(event) {
    const values = encodeURIComponent(event.target.value)
    const checks = ''
    const list_block = event.target.closest('.list')
    addItems({values, checks, list_block})
    event.target.value = ''
}

function addList({container, heading}) {
    const params = new URLSearchParams(window.location.search)
    const tc = document.querySelector('.list-template').content
    const list_block = tc.querySelector('.list').cloneNode()

    const lists = Array.from(container.querySelectorAll('.list'))
    const add_list_blocks = container.querySelectorAll('.add-list')
    const no_lists_message = container.querySelector('.no-lists') ?? null

    /* Generate a new list id number by incrementing the highest existing list
     * id number by 1.
     * This accommodates missing list id numbers as well as disordered list id
     * numbers.
     */
    const id_number = lists.reduce((id_number, list) => {
        const current_id = list.getAttribute('id')
        const current_id_number = +current_id.substring(1)

        if (current_id_number >= id_number) {
            return current_id_number + 1
        } else {
            return id_number
        }
    }, 1)

    const list_id = 'l' + id_number
    list_block.setAttribute('id', list_id)

    const list_heading = tc.querySelector('.list__heading').cloneNode()
    list_heading.appendChild(document.createTextNode(heading))
    list_block.appendChild(list_heading)

    // Use the defined list type or set a default of 'ul'
    const type = (function() {
        const param_type = params.get(list_id + 'type')
        if (param_type === null) {
            params.set(list_id, 'ul')
            return 'ul'
        }
        return param_type
    })()

    const list_type_block = tc.querySelector('.list__type').cloneNode(true)
    list_type_block.childNodes.forEach((node) => {
        if (node.tagName === 'INPUT') {
            node_id = node.getAttribute('id')
            node.setAttribute('id', list_id + node_id.slice(2))

            node_name = node.getAttribute('name')
            node.setAttribute('name', list_id + node_name.slice(2))

            node.removeAttribute('checked')
            if (node.value === type) node.setAttribute('checked', 'checked')

            node.addEventListener('change', setListTypeHandler)
        } else if (node.tagName === 'LABEL') {
            node_for = node.getAttribute('for')
            node.setAttribute('for', list_id + node_for.slice(2))
        }
    })

    list_block.appendChild(list_type_block)

    // Add the new list block after the last list block or, if this is the first
    // list, after _New List_ field.
    if (lists.length > 0) {
        lists.toReversed()[0].insertAdjacentElement('afterend', list_block)
    } else if (add_list_blocks.length > 0) {
        add_list_blocks[0].insertAdjacentElement('afterend', list_block)
    } else {
        container.appendChild(list_block)
    }

    // If this was the first list, add a _New List_ field at the end.
    if (lists.length === 0) {
        addNewListField(container)
    }

    if (no_lists_message !== null) no_lists_message.remove()

    // Add a "No items." message for the new list.
    addNoItemsMessage(list_block)

    // Add an _Add Item_ field for the new list.
    const new_item_field = addNewItemField(list_block)

    params.set(list_id + 'name', heading)
    params.set(list_id + 'type', 'ul')

    setUrl(params)
    return list_block
}

function addListHandler(event) {
    const input = event.target
    const container = input.closest('.lists')
    const heading = input.value
    const list_block = addList({container, heading})
    input.value = ''

    list_block.scrollIntoView({behavior: 'smooth'})
    /* Focus the empty list's _Add Item_ field after the UI has had a chance to
     * smoothly scroll into view.
     * The `preventScroll` option should make this unnecessary, but it isn't
     * currently supported on mobile browsers.
     */
    setTimeout(() => {
        const add_item_field = list_block.querySelector('.list__add-item input')
        add_item_field.focus({preventScroll: true})
    }, 500)
}

function getLists() {
    const params = new URLSearchParams(window.location.search)
    return Array.from(params.keys())
        .map((param) => {
            const list_name_match = param.match(/l(\d+)name/)

            if (list_name_match === null) return null

            const number = list_name_match[1]

            return {
                name: params.get(list_name_match[0]),
                number: number,
                type: params.get(`l${number}type`),
                items: params.get(`l${number}items`),
                checks: params.get(`l${number}checks`),
            }
        })
        .filter((list) => list !== null)
}

function updateCheck(event) {
    const checkbox = event.target
    const list = checkbox.closest('.list')
    const list_id = list.getAttribute('id')
    const list_checkboxes = list.querySelectorAll('input[type=checkbox]')

    const params = new URLSearchParams(window.location.search)
    const checks = params.get((list_id + 'checks'))

    const check_values = (function() {
        if (checks === null) {
            return list_checkboxes.map(checkbox => checkbox.checked ? '1' : '0')
        } else {
            return checks.split('')
        }
    })()

    /* Checkbox id numbers are natural counting numbers for user-friendly and
     * hackable URLs.
     * To get the array index we subtract 1 from the checkbox id number
     */
    const checkbox_number = checkbox.getAttribute('id').match(/-(\d+)$/)[1]
    const check_values_index = checkbox_number - 1

    check_values[check_values_index] = checkbox.checked ? '1' : '0'
    params.set(`${list_id}checks`, check_values.join(''))
    setUrl(params)
}

function setUrl(params) {
    // The toString method of URLSearchParams encodes commas to '%2C', but we
    // want the URL to remain user-friendly and hackable, so we change it back
    // to commas
    history.replaceState(null, '', '?' + params.toString().replace(/%2C/g, ','))
}

function addNewItemField(list_block) {
    const tc = document.querySelector('.list-template').content
    const add_item = tc.querySelector('.list__add-item').cloneNode(true)
    add_item.addEventListener('change', addItemHandler)
    list_block.appendChild(add_item)
    return add_item
}

function addNewListField(lists_container) {
    const tc = document.querySelector('.list-template').content
    const add_list = tc.querySelector('.add-list').cloneNode(true)
    add_list.addEventListener('change', addListHandler)
    lists_container.appendChild(add_list)
    return add_list
}

function addNoItemsMessage(list_block) {
    const no_items = document.createElement('p')
    no_items.classList.add('no-items')
    no_items.appendChild( document.createTextNode('No items.') )
    list_block.appendChild(no_items)
}

function setListTypeHandler(event) {
    // Identify the list and selected type.
    const target = event.target
    const name = target.getAttribute('name') // l<number>type
    const type  = target.value

    // Identify the old list and its items.
    const list_block = target.closest('.list')
    const old_list_list = list_block.querySelector('ul, ol')
    const list_items = old_list_list.querySelectorAll('li')
    
    // Move the items to a new list of the selected type.
    const tc = document.querySelector('.list-template').content
    const list_list = tc.querySelector(type).cloneNode()
    list_block.insertBefore(list_list, old_list_list)
    list_items.forEach(item => list_list.appendChild(item))

    // Remove the old list.
    old_list_list.remove()

    // Set the change in the query string.
    const params = new URLSearchParams(window.location.search)
    params.set(name, type)
    setUrl(params)
}
