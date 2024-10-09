const html = (strings: TemplateStringsArray) => strings.raw[0]

type Event = {
    id: string,
    name: string,
    date: string,
    type: string,
    distance: number
} | null

class Dashboard extends HTMLElement {
    private Scheduler = new Scheduler()
    private eventBuffer: Event[]
    private appState = {
        tableDomFlush: false,
        searchQuery: ''
    }

    constructor() {
        super()
        this.attachShadow({ mode: 'open' })
        this.eventBuffer = new Array(300).fill({ id: '', name: '', date: '', type: '' })
    }

    connectedCallback() {
        this.Scheduler.add(() => this.renderLoadingAnimation())
        this.Scheduler.add(() => this.fetchDataToBuffer())
    }

    levensteinDistanceForBuffer() {
        const searchQuery = this.appState.searchQuery;
        const searchQueryLength = searchQuery.length;
        const buffer = this.eventBuffer;

        for (let i = 0; i < buffer.length; i++) {
            const event = buffer[i];
            if (!event || event.name === '') break;

            const name = event.name;
            const nameLength = name.length;
            const matrix = Array(nameLength + 1).fill(null).map(() => Array(searchQueryLength + 1).fill(0));

            for (let i = 0; i <= nameLength; i++) {
                matrix[i][0] = i;
            }

            for (let j = 0; j <= searchQueryLength; j++) {
                matrix[0][j] = j;
            }

            for (let i = 1; i <= nameLength; i++) {
                for (let j = 1; j <= searchQueryLength; j++) {
                    const cost = name[i - 1] === searchQuery[j - 1] ? 0 : 1;
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j - 1] + cost
                    );
                }
            }

            event.distance = matrix[nameLength][searchQueryLength];
        }

        buffer.sort((a, b) => a!.distance - b!.distance);
    }

    async fetchDataToBuffer() {
        try {
            const resp = await fetch('http://localhost:3000/events')
            if (!resp.ok) throw new Error('Failed to fetch data')
            const data = await resp.json()

            data.forEach((event: Event, i: number) => {
                this.eventBuffer[i] = event
            })

            this.Scheduler.add(() => this.renderDashboardUI())
        } catch (e) {
            this.Scheduler.add(
                () => this.renderErrorUI(
                    e instanceof Error ? e.message : 'Failed to fetch data'
                )
            )
        }
    }

    renderDashboardUI() {
        // Event listeners
        setTimeout(() => {
            // Event list
            // const eventList =
            //     this.shadowRoot!.querySelector('#event-list');

            // eventList!.addEventListener('click', (event) => {
            //     const card = (event.target as HTMLElement).closest('[part="card"]');
            // });

            // Input
            const eventSearch = this.shadowRoot!.querySelector('#event-search') as HTMLInputElement;
            eventSearch.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    this.appState.searchQuery = eventSearch.value
                    this.Scheduler.add(() => this.levensteinDistanceForBuffer())
                    this.Scheduler.add(() => this.renderDashboardTable())
                }
            })

            this.appState.tableDomFlush = true
        }, 0)

        this.shadowRoot!.innerHTML = `
            <div part="dashboard-body">
                <div style="width: 100%;">
                    <input
                        part="event-search"
                        id="event-search"
                        type="text"
                        placeholder="Search ..."
                    />
                    ${this.renderDashboardTable()}
                </div>
                ${this.renderDashboardForm()}
            </div>
        `
    }

    renderDashboardTable() {
        let htmlContent = `<div part="table" id="event-list">`
        const htmlFooter = `</div>`

        outer: for (let i = 0; i < this.eventBuffer.length; i++) {
            const event = this.eventBuffer[i]
            if (!event || event.name === '') break outer
            const date = event.date.split('-')

            htmlContent += `
                <div part="card" id="${event.id}">
                    <span>${event.name}</span>
                    <span>${`${date[2]}.${date[1]}.${date[0]}`}</span>
                    <span>${event.type}</span>
                    <span href="" part="delete-button">Delete</span>
                </div>
            `;
        }

        if (this.appState.tableDomFlush) {
            const eventList =
                this.shadowRoot!.querySelector('#event-list');

            while (eventList?.firstChild) {
                eventList.removeChild(eventList.firstChild)
            }

            eventList!.innerHTML = htmlContent + htmlFooter
        }

        return htmlContent + htmlFooter
    }

    renderDashboardForm() {
        return html`
            <div part="form">
                <input part="input" type="text" placeholder="Event name" />
                <input part="input" type="date" placeholder="Event date" />
                <select part="select" name="event-type">
                    <option value="birthday">Birthday</option>
                    <option value="wedding">Wedding</option>
                    <option value="party">Party</option>
                </select>
                <button part="button" type="submit">Create event</button>
            </div>
        `
    }

    renderErrorUI(msg: string) {
        this.shadowRoot!.innerHTML =
            `<p part="err-msg">${msg}</p>`
    }

    renderLoadingAnimation() {
        this.shadowRoot!.innerHTML =
            "<div part='loading' />"
    }
}

class Scheduler {
    private queue: (() => void)[] = []
    private running: boolean = false

    add(task: () => void) {
        this.queue.push(task)
        if (!this.running) {
            this.runNext()
        }
    }

    private async runNext() {
        if (this.queue.length === 0) {
            this.running = false
            return
        }

        this.running = true
        const task = this.queue.shift()

        try {
            if (task) task()
        } catch (e) {
            console.error(e)
        } finally {
            this.running = false
            this.runNext()
        }
    }
}

customElements.define('dashboard-component', Dashboard)
