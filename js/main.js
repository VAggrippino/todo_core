window.addEventListener('load', () => {
    const list_container = (document.querySelector('section.lists'))
    const template = document.querySelector('.list-block-template')

    if (! template) {
        console.error('An unexpected error occurred. The list block template could not be found.')
        return false
    }

    // Process each list and its items from the URL query string
    const params = new URLSearchParams(window.location.search)

    const query_parameters = Array.from(params.keys())
    const list_names = query_parameters
        .map((param) => {
            const list_name_match = param.match(/l(\d+)name/)
            if (list_name_match === null) return null
            return {
                name: params.get(list_name_match[0]) ?? '',
                number: list_name_match[1] ?? ''
            }
        })
        .filter((list) => list !== null)

    list_names.forEach((list_name, list_index) => {
        const list_number = list_name.number

        const tc = template.content

        const list_block = tc.querySelector('div.list').cloneNode()
        list_block.setAttribute('id', 'l' + list_number)
        list_container.appendChild(list_block)

        const list_heading = tc.querySelector('.list__heading').cloneNode()
        list_heading.innerText = list_name.name
        list_block.appendChild(list_heading)

        const list_ul = tc.querySelector('.list ul').cloneNode()

        list_block.appendChild(tc.querySelector('.list__add-item').cloneNode(true))

        const list_items = params.get(`l${list_number}items`)
        if (list_items !== null) {
            const item_texts = list_items.split(',')
            const items = item_texts.map((item_text, item_index) => {
                const item_id = `l${list_index}-${item_index}`

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

            list_block.appendChild(tc.querySelector('.list__add-item').cloneNode(true))
        } else {
            const no_items_message = document.createElement('p')
            no_items_message.appendChild( document.createTextNode('No items') )

            list_block.appendChild(no_items_message)
        }
    
        const add_item_inputs = list_block.querySelectorAll('.list__add-item input')
        add_item_inputs.forEach(input => input.addEventListener('change', addItem))
    })
})

function addItem(event) {
    const input = event.target
    const params = new URLSearchParams(window.location.search)
    const list_block = input.closest('.list')
    const list_id = list_block.getAttribute('id')

    const list_items = params.get(`${list_id}items`)
    const list_items_array = list_items && list_items.split(',') || []
    list_items_array.push(input.value)
    params.set(`${list_id}items`, list_items_array)

    const list_checks = params.get(`${list_id}checks`) ?? ''

    params.set(`${list_id}checks`, list_checks + '0')

    // The toString method of URLSearchParams encodes commas to '%2C', but we
    // want the URL to remain user-friendly and hackable, so we change it back
    // to commas
    window.location.href = '?' + params.toString().replace(/%2C/g, ',')
}