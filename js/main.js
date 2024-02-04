window.addEventListener('load', () => {
    const lists_container = (document.querySelector('section.lists'))
    const template = document.querySelector('.list-template')
    const tc = template.content

    lists_container.appendChild(tc.querySelector('.add-list').cloneNode(true))

    // Process each list and its items from the URL query string
    const params = new URLSearchParams(window.location.search)
    const lists = getLists(params)

    lists.forEach((list) => {
        const list_block = tc.querySelector('.list').cloneNode()
        list_block.setAttribute('id', 'l' + list.number)
        lists_container.appendChild(list_block)

        const list_heading = tc.querySelector('.list__heading').cloneNode()
        list_heading.appendChild(document.createTextNode(list.name))
        list_block.appendChild(list_heading)

        // TODO: Add a list type selector (ordered / unordered)

        const list_list = tc.querySelector(`.list ${list.type}`).cloneNode()

        if (list.items !== null) {
            list_block.appendChild(tc.querySelector('.list__add-item').cloneNode(true))

            const item_texts = list.items.split(',')
            const items = item_texts.map((text, index) => {
                const item_number = index + 1
                const item_id = `l${list.number}-${item_number}`

                const li = tc.querySelector('li').cloneNode(true)

                const checkbox = li.querySelector('input[type=checkbox]')
                checkbox.setAttribute('id', item_id)
                checkbox.setAttribute('name', item_id)
                checkbox.removeAttribute('checked')

                // TODO: Add a handler for checkbox change event

                // Since we did a _deep_ clone of the list item, we replace the
                // `innerText` of the label rather than just appending a
                // `document.createTextNode`
                const label = li.querySelector('label')
                label.setAttribute('for', item_id)
                label.innerText = text

                return li
            })

            if (list.checks !== null) {
                const checks = list.checks.split('')
                items.forEach((item, index) => {
                    const check_value = checks[index] ?? '0'
                    const item_checkbox = item.querySelector('input[type=checkbox]')
                    if (check_value === '1') {
                        item_checkbox.setAttribute('checked', 'checked')
                    } else {
                        item_checkbox.removeAttribute('checked')
                    }
                })
            }

            for (const item of items) {
                list_list.appendChild(item)
            }
            list_block.appendChild(list_list)
        } else {
            const no_items = document.createElement('p')
            no_items.appendChild( document.createTextNode('No items') )
            list_block.appendChild(no_items)
        }

        list_block.appendChild(tc.querySelector('.list__add-item').cloneNode(true))
    
        const add_item_inputs = list_block.querySelectorAll('.list__add-item input')
        add_item_inputs.forEach(input => input.addEventListener('change', addItem))
    })

    if (lists.length > 0) {
        lists_container.appendChild(tc.querySelector('.add-list').cloneNode(true))
    }

    lists_container.querySelectorAll('.add-list input').forEach((input) => {
        input.addEventListener('change', addList)
    })
})

function addItem(event) {
    const input = event.target
    const params = new URLSearchParams(window.location.search)
    const list_block = input.closest('.list')
    const list_id = list_block.getAttribute('id')

    const list_items = params.get(`${list_id}items`)
    const list_items_array = list_items ? list_items.split(',') : []

    list_items_array.push(input.value)
    params.set(`${list_id}items`, list_items_array)

    // Recreate the checks parameter value based on the actual checkbox values
    const checks = Array.from(list_block.querySelectorAll('input[type=checkbox]'))
        .map(checkbox => checkbox.checked ? '1' : '0')
        .join('')

    params.set(`${list_id}checks`, checks + '0')

    const tc = document.querySelector('.list-template').content
    const new_item = tc.querySelector('.list li').cloneNode(true)
    const new_item_number = list_items_array.length - 1
    const new_item_id = `${list_id}-${new_item_number}`

    const new_item_input = new_item.querySelector('input')
    new_item_input.setAttribute('value', input.value)
    new_item_input.setAttribute('name', new_item_id)
    new_item_input.setAttribute('id', new_item_id)
    new_item_input.removeAttribute('checked')

    // Since we _deep_ cloned the template list item, we replace the `innerText`
    // rather than just appending `document.createTextNode`
    const new_item_label = new_item.querySelector('label')
    new_item_label.setAttribute('for', new_item_id)
    new_item_label.innerText = input.value

    // Identify an existing list or create a new one
    const list_list = (function() {
        const existing_list_list = list_block.querySelector('ul, ol')
        if (existing_list_list === null) {
            const new_list_list = tc.querySelector('ul').cloneNode()
            list_block.appendChild(new_list_list)

            // Add the list type to the query parameters
            params.set(`${list_id}type`, 'ul')

            /* Empty list blocks have one _Add Item_ input, but list blocks with
             * items have _Add Item_ fields before and after the list of items.
            */
            list_block.appendChild(tc.querySelector('.list__add-item').cloneNode(true))

            return new_list_list
        } else {
            return existing_list_list
        }
    })()

    list_list.appendChild(new_item)

    // The toString method of URLSearchParams encodes commas to '%2C', but we
    // want the URL to remain user-friendly and hackable, so we change it back
    // to commas
    history.replaceState(null, '', '?' + params.toString().replace(/%2C/g, ','))

    input.value = ''
}

function addList(event) {
    const input = event.target
    const lists_container = input.closest('.lists')

    const tc = document.querySelector('.list-template').content
    const new_list = tc.querySelector('.list').cloneNode()

    /* Iterate over existing list ids and incrementing the greatest of them by 1.
     * This accommodates missing list id numbers as well as disordered list id numbers.
     */
    const lists = Array.from(lists_container.querySelectorAll('.list'))
    const list_id_number = lists.reduce((id_number, current_list) => {
        const current_id = current_list.getAttribute('id')
        const current_id_value = +current_id.substring(1)

        if (current_id_value >= id_number) {
            return current_id_value + 1
        } else {
            return id
        }
    }, 1)

    const list_id = 'l' + list_id_number
    new_list.setAttribute('id', list_id)

    const list_heading = tc.querySelector('.list__heading').cloneNode()
    list_heading.appendChild(document.createTextNode(input.value))
    new_list.appendChild(list_heading)

    // TODO: Add a list type selector (ordered / unordered)

    const add_item = tc.querySelector('.list__add-item').cloneNode(true)
    add_item.addEventListener('change', addItem)
    new_list.appendChild(add_item)

    // Insert the new list before the last _Add List_ block
    const add_list_blocks = Array.from(lists_container.querySelectorAll('.add-list'))
    const last_add_list_block = add_list_blocks.toReversed()[0]
    lists_container.insertBefore(new_list, last_add_list_block)

    const params = new URLSearchParams(window.location.search)
    params.set(list_id + 'name', input.value)

    // The toString method of URLSearchParams encodes commas to '%2C', but we
    // want the URL to remain user-friendly and hackable, so we change it back
    // to commas
    history.replaceState(null, '', '?' + params.toString().replace(/%2C/g, ','))

    input.value = ''

    location.replace('#' + list_id)
}

function getLists(params) {
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