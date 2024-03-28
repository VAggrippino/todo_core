window.addEventListener('DOMContentLoaded', () => {
    const lists_container = document.querySelector('section.lists')

    // Process each list and its items from the URL query string
    const lists = getLists()

    // If there weren't any lists, add a "No lists" message.
    if (lists.length === 0) {
        const no_lists = document.createElement('p')
        no_lists.classList.add('no-lists')
        no_lists.append('No lists.')
        lists_container.append(no_lists)
    }

    // This initial _New List_ field will be after the "No lists" message
    // (above) or before the lists (below).
    addNewListField(lists_container)

    // Build each list from the query parameters' data
    lists.forEach((list) => {
        const list_block = addList(list)

        if (list.items !== null) {
           addItems(list)
        } else {
            addNoItemsMessage(list_block)
        }
    })

    // Add a placeholder for drag and drop operations after all the list blocks.
    if (lists.length > 0) {
        const last_list = document.querySelector(':nth-last-child(1 of .lists .list)')
        addPlaceholder(last_list)
    }

    // Prevent inputs from being drop targets.
    document.querySelectorAll('input').forEach((input) => {
        input.addEventListener('dragover',  e => e.dataTransfer.dropEffect = 'none')
    })

    // Set the `draggable` property and event handlers on elements with the
    // `draggable` CSS class.
    const draggables = document.querySelectorAll('.draggable')
    draggables.forEach((item) => {
        // If the item doesn't already have an id, generate one.
        {
            const id = item.getAttribute('id')
            const generated_id = item.tagName + '-' + Math.random() * 10000
            if (id === null) item.setAttribute('id', generated_id)
        }

        item.setAttribute('draggable', 'true')

        item.addEventListener('dragstart', (event) => {
            // Prevent `dragstart` from being triggered on ancestors.
            event.stopPropagation()
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', item.getAttribute('id'))
        })

        item.addEventListener('dragend', (event) => {
            event.stopPropagation()
            const inserts = document.querySelectorAll('.insert-before, .insert-after, .targeted')
            inserts.forEach((item) => {
                item.classList.remove('insert-before', 'insert-after', 'targeted')
            })
        })
    })

    // Add event handlers for drop targets to elements with the `droppable` CSS class
    const droppables = document.querySelectorAll('.lists .droppable')
    droppables.forEach((item) => {
        item.addEventListener('dragover', e => e.preventDefault())
        item.addEventListener('dragenter', dragenterHandler)
        item.addEventListener('drop', dropHandler)
    })
})

function addItems(list) {
    // const list_id = list_block.getAttribute('id')
    const list_id = 'l' + list.number
    const list_block = document.getElementById(list_id)
    const tc = document.querySelector('.list-template').content

    // Use an existing list or create a new one
    const list_list = (function() {
        const existing_list_list = list_block.querySelector('ul, ol')

        if (existing_list_list !== null) return existing_list_list

        const list_list = tc.querySelector(list.type ?? 'ul').cloneNode()
        list_block.append(list_list)

        addNewItemField(list_block)

        return list_list
    })()

    const items = Array.from(list_list.querySelectorAll('li'))

    // If the list didn't have any items yet, remove the "No items." message.
    if (items.length === 0) {
        list_block.querySelector('.no-items').remove()
    }

    // Add the items
    list.items.split(',').forEach((value, index) => {
        // Create the new item.
        const decoded_value = decodeURIComponent(value)
        const item = tc.querySelector('li').cloneNode(true)
        const item_id_number = items.length + index + 1
        const item_id = list_id + '-' + item_id_number

        // Set up the checkbox.
        const checkbox = item.querySelector('input[type=checkbox]')
        checkbox.setAttribute('value', value)
        checkbox.setAttribute('name', item_id)
        checkbox.setAttribute('id', item_id)

        const check = list.checks.slice(index, index + 1)

        if (check === '1') {
            checkbox.setAttribute('checked', 'checked')
        } else {
            checkbox.removeAttribute('checked')
        }

        checkbox.addEventListener('change', updateCheck)

        // Set up the label.
        /* Since we _deep_ cloned the template list item, we replace the
         * `innerText` rather than just appending text.
         */
        const label = item.querySelector('label')
        label.setAttribute('for', item_id)
        label.innerText = decoded_value

        // Add the new item to the page.
        list_list.append(item)

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

    const params = new URLSearchParams(window.location.search)
    params.set(list_id + 'items', param.items.join(','))
    params.set(list_id + 'checks', param.checks.join(''))

    setUrl(params)
}

function addItemHandler(event) {
    const checks = ''
    const list_block = event.target.closest('.list')
    const list = {
        number: list_block.getAttribute('id').slice(1),
        items: encodeURIComponent(event.target.value),
        checks: checks,
    }

    addItems(list)
    event.target.value = ''
}

function addList(list) {
    const tc = document.querySelector('.list-template').content
    const list_block = tc.querySelector('.list').cloneNode()

    const container = document.querySelector('.lists')

    const lists = Array.from(container.querySelectorAll('.list'))
    const add_list_blocks = container.querySelectorAll('.add-list')
    
    // If there's a "No Lists" message, remove it.
    const no_lists_message = container.querySelector('.no-lists') ?? null
    if (no_lists_message !== null) no_lists_message.remove()

    // Use the existing list ID number, if provided, or generate a new one.
    const id_number = (function() {
        if (typeof list.number !== 'undefined') return list.number
        const new_id = lists.reduce((id_number, list) => {
            const current_id = list.getAttribute('id')
            const current_id_number = +current_id.slice(1)
            if (current_id_number >= id_number) {
                return current_id_number + 1
            } else {
                return id_number
            }
        }, 1)
        return new_id
    })()

    // Set the HTML id attribute for the new list block.
    const list_id = 'l' + id_number
    list_block.setAttribute('id', list_id)

    // Create the list heading.
    const heading = tc.querySelector('.list__heading').cloneNode()
    heading.append(list.name)
    list_block.append(heading)

    // Use the defined list type or set it to 'ul' if it's not already set.
    const type = list.type ?? 'ul'

    // Add a list type selector.
    const type_selector = tc.querySelector('.list__type').cloneNode(true)
    type_selector.childNodes.forEach((node) => {
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
    list_block.append(type_selector)

    // Add a droppable placeholder after the last list or after the first
    // _add list_ field if this is the first list.
    const placeholder = (function() {
        if (lists.length > 0) {
            return addPlaceholder(lists.toReversed()[0])
        } else {
            return addPlaceholder(add_list_blocks[0])
        }
    })()

    // Add the new list block after the placeholder
    placeholder.insertAdjacentElement('afterend', list_block)

    // If this was the first list, add a _New List_ field after it.
    if (lists.length === 0) {
        addNewListField(container)
    }

    // Add a "No items." message for the new list.
    addNoItemsMessage(list_block)

    // Add an _Add Item_ field for the new list.
    addNewItemField(list_block)

    // If the list number wasn't previously set, it's a new list. So, we need to
    // add query parameters for it and set properties on the list object.
    if (typeof list.number === 'undefined') {
        const params = new URLSearchParams(window.location.search)
        params.set(list_id + 'name', list.name)
        params.set(list_id + 'type', type)

        setUrl(params)

        list.number = id_number
        list.type = type
    }

    return list_block
}

function addListHandler(event) {
    const input = event.target
    const heading = input.value
    const list_block = addList({name: heading})
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
    const lists = Array.from(params.keys())
        .map((param) => {
            const list_name_match = param.match(/l(\d+)name/)

            // If this key isn't a list name, return null.
            // Nulls are filtered out next.
            if (list_name_match === null) return null

            const number = list_name_match[1]

            const list = {
                name: params.get(list_name_match[0]),
                number: number,
                type: params.get(`l${number}type`),
                items: params.get(`l${number}items`),
                checks: params.get(`l${number}checks`),
            }
            return list
        })
        .filter((list) => list !== null)
    return lists
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
    list_block.append(add_item)
    return add_item
}

function addNewListField(lists_container) {
    const tc = document.querySelector('.list-template').content
    const add_list = tc.querySelector('.add-list').cloneNode(true)
    add_list.addEventListener('change', addListHandler)
    lists_container.append(add_list)
    return add_list
}

function addNoItemsMessage(list_block) {
    const no_items = document.createElement('p')
    no_items.classList.add('no-items')
    no_items.append('No items.')
    list_block.append(no_items)
}

function setListTypeHandler(event) {
    // Identify the list and selected type.
    const target = event.target
    const name = target.getAttribute('name') // l<number>type
    const type = target.value

    // Identify the old list and its items.
    const list_block = target.closest('.list')
    const old_list_list = list_block.querySelector('ul, ol')
    const list_items = old_list_list.querySelectorAll('li')
    
    // Move the items to a new list of the selected type.
    const tc = document.querySelector('.list-template').content
    const list_list = tc.querySelector(type).cloneNode()
    list_block.insertBefore(list_list, old_list_list)
    list_items.forEach(item => list_list.append(item))

    // Remove the old list.
    old_list_list.remove()

    // Set the change in the query string.
    const params = new URLSearchParams(window.location.search)
    params.set(name, type)
    setUrl(params)
}

function addPlaceholder(target) {
    const tc = document.querySelector('.list-template').content
    const placeholder = tc.querySelector('.list__placeholder').cloneNode()
    target.insertAdjacentElement('afterend', placeholder)
    return placeholder
}

function dragenterHandler(event) {
    // Prevent `dragenter` from being triggered on ancestors.
    event.stopPropagation()

    const dt = event.dataTransfer
    const dragged_id = dt.getData('text/plain')
    const dragged = document.getElementById(dragged_id)
    const droptarget = event.target.closest('.droppable')

    // Don't do anything if the element is dragged over itself or the element
    // after it.
    if (dragged === droptarget) return
    if (droptarget === dragged.nextElementSibling) return

    // Remove classes that were added during `dragenter` events for other drop
    // targets.
    const inserts = document.querySelectorAll('.insert-before, .insert-after, .targeted')
    inserts.forEach((item) => {
        item.classList.remove('insert-before', 'insert-after', 'targeted')
    })

    // Convenience booleans:
    const dragged_is_list_block = dragged.classList.contains('list')
    const dragged_is_list_item = dragged.tagName === 'LI'

    const droptarget_is_placeholder = droptarget.classList.contains('list__placeholder')
    const droptarget_is_list_block = droptarget.classList.contains('list')
    const droptarget_is_list = droptarget.tagName === 'OL' || droptarget.tagName === 'UL'
    const droptarget_is_list_item = droptarget.tagName === 'LI'

    if (dragged_is_list_block) {
        const next_list = document.querySelector(`#${dragged_id} ~ .list`)

        // Don't do anything if a list block is dragged over an adjacent element.
        if (droptarget === dragged.previousElementSibling) return
        if (droptarget === dragged.nextElementSibling) return

        // Don't do anything if the drop target is the next list block.
        if (droptarget_is_list_block) {
            if (droptarget === next_list) return
        }

        // Don't do anything if the drop target is inside the dragged list box
        // or the next list box.
        if (droptarget_is_list || droptarget_is_list_item) {
            const ancestor = droptarget.closest('.list')
            if (ancestor === dragged || ancestor === next_list) return
        }

        // Identify the target placeholder and add the CSS class that shows
        // where we're moving the list block.
        const target_placeholder = (function() {
            if (droptarget_is_placeholder) return droptarget
            if (droptarget_is_list_block) return droptarget.previousElementSibling

            // The droptarget is a list or list item
            return droptarget.closest('.list').previousElementSibling
        })()
        target_placeholder.classList.add('targeted')
    }

    if (dragged_is_list_item) {
        // Don't do anything if we drag a list item over itself or the item after it.
        if ([dragged, dragged.nextElementSibling].includes(droptarget)) return

        if (droptarget_is_list_item) {
            droptarget.classList.add('insert-before')
        } else {
            const insert_target = (function() {
                // If the drop target is a placeholder, the insert target is the
                // list in the following list block, or the list block itself if
                // it doesn't contain a list.
                if (droptarget_is_placeholder) {
                    const list_block = droptarget.nextElementSibling
                    return list_block.querySelector('ul, ol') || list_block
                }

                // If the drop target is a list block, the insert target is the
                // list it contains, or the list block itself if it doesn't
                // contain a list.
                if (droptarget_is_list_block) {
                    return droptarget.querySelector('ul, ol') || droptarget
                }

                // If we get here, the insert target is the drop target, which is a list.
                return droptarget
            })()

            insert_target.classList.add('insert-after')
        }
    }
}

function dropHandler(event) {
    event.stopPropagation()

    const dragged_id = event.dataTransfer.getData('text/plain')
    const dragged = document.getElementById(dragged_id)
    const droptarget = event.target.closest('.droppable')

    const dragged_tag = dragged.tagName
    const droptarget_tag = droptarget.tagName

    const origin_list_block = dragged.closest('.list')

    // Convenience booleans:
    const dragged_is_list_block = dragged.classList.contains('list')
    const dragged_is_list_item = dragged_tag === 'LI'

    const droptarget_is_placeholder = droptarget.classList.contains('list__placeholder')
    const droptarget_is_list_block = droptarget.classList.contains('list')
    const droptarget_is_list = droptarget_tag === 'UL' || droptarget_tag === 'OL'
    const droptarget_is_list_item = droptarget_tag === 'LI'

    if (dragged_is_list_block) {
        const before = dragged.previousElementSibling
        const after = dragged.nextElementSibling

        const target = (function() {
            if (droptarget_is_placeholder) return droptarget
            if (droptarget_is_list_block) return droptarget.previousElementSibling

            // If we get here, the droptarget is either a list(ul/ol) or a list item(li).
            return droptarget.closest('.list').previousElementSibling
        })()

        // Don't do anything if the target placeholder is adjacent to the
        // dragged list block.
        if ([before, after].includes(target)) return

        // Move the dragged list block and its preceding placeholder before the
        // target placeholder.
        target.insertAdjacentElement('beforebegin', before)
        target.insertAdjacentElement('beforebegin', dragged)
    }

    if (dragged_is_list_item) {
        // Don't do anything if we dropped the list item over itself or the item
        // after it.
        if ([droptarget, dragged.nextElementSibling].includes(dragged)) return

        // If we drop the list item on a placeholder, move it to the end of the
        // following list.
        if (droptarget_is_placeholder) {
            const target_list = droptarget.nextElementSibling.querySelector('ul, ol')
            target_list.append(dragged)
        }

        // If we drop the list item on a list block, move it to the end of the
        // list inside or create a new list if the droptarget is an empty list
        // block.
        if (droptarget_is_list_block) {
            const target_list = (function() {
                const origin_list_type = dragged.closest('ul, ol').tagName.toLowerCase()
                const existing_list = droptarget.querySelector('ul, ol')

                if (existing_list === null) {
                    const tc = document.querySelector('.list-template').content
                    const new_list = tc.querySelector(list_type).cloneNode()
                    droptarget.append(new_list)
                    return new_list
                }

                return existing_list
            })()

            target_list.append(dragged)

            // Remove the origin list if it's empty now.
            if (origin_list_block.querySelectorAll('li').length === 0) origin_list_block.remove()
        }

        // If we drop the list item on another list item, insert it before the
        // target.
        if (droptarget_is_list_item) {
            droptarget.insertAdjacentElement('beforebegin', dragged)
        }

        // If we drop the list item over a list (ul/ol), move it to the end of
        // the list.
        if (droptarget_is_list) {
            droptarget.append(dragged)
        }
    }

    // Redefine element IDs for the modified lists
    const target_list_block = droptarget.closest('.list')

    for (const list_block of [origin_list_block, target_list_block]) {
        list_id = list_block.getAttribute('id')
        list_block.querySelectorAll('li').forEach((item, index) => {
            const new_id = `${list_id}-${index + 1}`
            const checkbox = item.querySelector('input[type=checkbox')
            const label = item.querySelector('label')
            checkbox.setAttribute('id', new_id)
            label.setAttribute('for', new_id)
        })
        updateUrlListItems(list_block)
    }
}

function updateUrlListItems(list_block) {
    const list_id = list_block.getAttribute('id')
    const param = {
        items: [],
        checks: [],
    }

    // Get the current items and the checked status of each item from the document
    const items = list_block.querySelectorAll('li')
    items.forEach((item) => {
        const checkbox = item.querySelector('input[type=checkbox')
        param.items.push(checkbox.value)
        param.checks.push(checkbox.checked ? '1' : '0')
    })

    // Update the URL params with the current information
    const params = new URLSearchParams(window.location.search)
    params.set(list_id + 'items', param.items.join(','))
    params.set(list_id + 'checks', param.checks.join(''))

    setUrl(params)
}