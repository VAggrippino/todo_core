window.addEventListener('load', () => {
    const lists_container = (document.querySelector('section.lists'))
    const template = document.querySelector('.list-block-template')

    if (! template) {
        console.error('An unexpected error occurred. The list block template could not be found.')
        return false
    }

    const tc = template.content

    lists_container.appendChild(tc.querySelector('.add-list').cloneNode(true))

    // Process each list and its items from the URL query string
    const params = new URLSearchParams(window.location.search)
    const list_names = getListNames(params)

    list_names.forEach((list_name) => {
        const list_number = list_name.number

        const list_block = tc.querySelector('.list').cloneNode()
        list_block.setAttribute('id', 'l' + list_number)
        lists_container.appendChild(list_block)

        const list_heading = tc.querySelector('.list__heading').cloneNode()
        list_heading.innerText = list_name.name
        list_block.appendChild(list_heading)

        const list_ul = tc.querySelector('.list ul').cloneNode()

        const list_items = params.get(`l${list_number}items`)
        if (list_items !== null) {
            list_block.appendChild(tc.querySelector('.list__add-item').cloneNode(true))

            const item_texts = list_items.split(',')
            const items = item_texts.map((item_text, item_index) => {
                const item_id = `l${list_number}-${item_index}`

                const li = tc.querySelector('.list__item').cloneNode(true)

                const checkbox = li.querySelector('input[type=checkbox]')
                checkbox.setAttribute('id', item_id)
                checkbox.removeAttribute('checked')

                const label = li.querySelector('label')
                label.setAttribute('for', item_id)
                label.innerText = item_text

                return li
            })

            const checks = params.get(`l${list_number}checks`)
            if (checks !== null) {
                const checks_array = checks.split('')
                items.forEach((item, index) => {
                    const check_value = checks_array[index] ?? '0'
                    const item_checkbox = item.querySelector('input[type=checkbox]')
                    if (check_value === '1') {
                        item_checkbox.setAttribute('checked', 'checked')
                    } else {
                        item_checkbox.removeAttribute('checked')
                    }
                })
            }

            for (const item of items) {
                list_ul.appendChild(item)
            }
            list_block.appendChild(list_ul)
        } else {
            const no_items_message = document.createElement('p')
            no_items_message.appendChild( document.createTextNode('No items') )

            list_block.appendChild(no_items_message)
        }

        list_block.appendChild(tc.querySelector('.list__add-item').cloneNode(true))
    
        const add_item_inputs = list_block.querySelectorAll('.list__add-item input')
        add_item_inputs.forEach(input => input.addEventListener('change', addItem))
    })

    if (list_names.length > 0) {
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

    const list_checks = params.get(`${list_id}checks`) ?? ''
    params.set(`${list_id}checks`, list_checks + '0')

    const tc = document.querySelector('.list-block-template').content
    const new_item = tc.querySelector('.list__item').cloneNode(true)
    const new_item_number = list_items_array.length - 1
    const new_item_id = `${list_id}-${new_item_number}`

    const new_item_input = new_item.querySelector('input')
    new_item_input.setAttribute('value', input.value)
    new_item_input.setAttribute('name', new_item_id)
    new_item_input.setAttribute('id', new_item_id)
    new_item_input.removeAttribute('checked')

    const new_item_label = new_item.querySelector('label')
    new_item_label.setAttribute('for', new_item_id)
    new_item_label.innerText = input.value

    list_block.querySelector('ul').appendChild(new_item)

    // The toString method of URLSearchParams encodes commas to '%2C', but we
    // want the URL to remain user-friendly and hackable, so we change it back
    // to commas
    history.replaceState(null, '', '?' + params.toString().replace(/%2C/g, ','))

    input.value = ''
}

function addList(event) {
    const input = event.target
    const lists_container = input.closest('.lists')
    const params = new URLSearchParams(window.location.search)

    const list_names = getListNames(params)

    const tc = document.querySelector('.list-block-template').content
    const new_list = tc.querySelector('.list').cloneNode()
    const new_list_heading = tc.querySelector('.list__heading').cloneNode()
    const new_add_item = tc.querySelector('.list__add-item').cloneNode(true)

    new_list_heading.innerText = input.value
    new_list.appendChild(new_list_heading)
    new_list.appendChild(new_add_item)
    lists_container.appendChild(new_list)

    if (list_names.length === 0) {
        params.set('l1name', input.value)
    } else {
        const new_list_number = list_names.reduce((next_number, list_name) => {
            const number = parseInt(list_name.number)
            return (number >= next_number) ? number + 1 : next_number
        }, 0)

        params.set(`l${new_list_number}name`, input.value)
    }

    // The toString method of URLSearchParams encodes commas to '%2C', but we
    // want the URL to remain user-friendly and hackable, so we change it back
    // to commas
    history.replaceState(null, '', '?' + params.toString().replace(/%2C/g, ','))

    input.value = ''
}

function getListNames(params) {
    return Array.from(params.keys())
        .map((param) => {
            const list_name_match = param.match(/l(\d+)name/)
            if (list_name_match === null) return null
            return {
                name: params.get(list_name_match[0]),
                number: list_name_match[1],
            }
        })
        .filter((list) => list !== null)
}