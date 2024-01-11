window.addEventListener('load', () => {
    const lists_container = document.querySelector('section.lists')

    // Process each list and its items from the URL query string
    const params = new URLSearchParams(window.location.search)
    for (const param of params.keys()) {
        const list_name = param.match(/l(\d+)name/)
        if (list_name !== null) {
            const list_number = list_name[1]

            const list_block = document.createElement('div')

            const list_heading = document.createElement('h2')
            list_heading.appendChild( document.createTextNode(params.get(list_name[0])) )

            list_block.appendChild(list_heading)

            // Create an array from provided list items (empty if not provided)
            const list_items = params.get(`l${list_number}items`)
            const list_items_array = (function () {
                if (list_items !== null) return list_items.split(',')
                return []
            })()

            // Create an array from provided list item checkbox values (empty if not provided)
            const list_checks = params.get(`l${list_number}checks`)
            const list_checks_array = (function () {
                if (list_checks !== null) return list_checks.split('')
                return Array(list_items_array.length).fill(0)
            })()

            if (list_items_array.length > 0) {
                const list = document.createElement('ul')
                const items = list_items_array.map((item_text, index) => {
                    const item = document.createElement('li')

                    const checkbox = document.createElement('input')
                    checkbox.setAttribute('type', 'checkbox')
                    checkbox.setAttribute('name', `l${list_number}-${index}`)
                    checkbox.setAttribute('id', `l${list_number}-${index}`)
                    checkbox.setAttribute('value', item_text)
                    
                    if (list_checks_array[index] === '1') {
                        checkbox.setAttribute('checked', true)
                    }

                    const label = document.createElement('label')
                    label.appendChild(checkbox)
                    label.appendChild( document.createTextNode(item_text) )

                    item.appendChild(label)

                    return item
                })

                for (const item of items) {
                    list.appendChild(item)
                }

                list_block.appendChild(list)
            } else {
                const none_message = document.createElement('p')
                none_message.appendChild( document.createTextNode('No items') )

                list_block.appendChild(none_message)
            }

            lists_container.appendChild(list_block)
        }
    }
})