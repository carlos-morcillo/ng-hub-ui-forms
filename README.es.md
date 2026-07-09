# ng-hub-ui-forms

**Español** | [English](./README.md)

Campos de formulario accesibles y **basados en signals** para Angular — input,
textarea, slider, select y datepicker — con **visualización automática de errores
de validación** para controles, `FormGroup` y `FormArray`. Reactive Forms hoy,
listo para Signal Forms. Tematizado por completo con variables CSS `--hub-*`, sin
Bootstrap.

## Documentación y ejemplos en vivo

Este paquete forma parte de [Hub UI](https://hubui.dev/), una colección de bibliotecas de componentes Angular para aplicaciones standalone.

- Documentación: https://hubui.dev/forms/overview/
- Ejemplos en vivo: https://hubui.dev/forms/examples/
- Hub UI: https://hubui.dev/

## 🧩 Familia `ng-hub-ui`

Esta biblioteca forma parte del ecosistema **ng-hub-ui**:

- [**ng-hub-ui-accordion**](https://www.npmjs.com/package/ng-hub-ui-accordion) _(obsoleto → usa panels)_
- [**ng-hub-ui-action-sheet**](https://www.npmjs.com/package/ng-hub-ui-action-sheet)
- [**ng-hub-ui-avatar**](https://www.npmjs.com/package/ng-hub-ui-avatar)
- [**ng-hub-ui-board**](https://www.npmjs.com/package/ng-hub-ui-board)
- [**ng-hub-ui-breadcrumbs**](https://www.npmjs.com/package/ng-hub-ui-breadcrumbs)
- [**ng-hub-ui-calendar**](https://www.npmjs.com/package/ng-hub-ui-calendar)
- [**ng-hub-ui-dropdown**](https://www.npmjs.com/package/ng-hub-ui-dropdown)
- [**ng-hub-ui-ds**](https://www.npmjs.com/package/ng-hub-ui-ds)
- [**ng-hub-ui-forms**](https://www.npmjs.com/package/ng-hub-ui-forms) ← Estás aquí
- [**ng-hub-ui-history**](https://www.npmjs.com/package/ng-hub-ui-history)
- [**ng-hub-ui-milestones**](https://www.npmjs.com/package/ng-hub-ui-milestones)
- [**ng-hub-ui-modal**](https://www.npmjs.com/package/ng-hub-ui-modal)
- [**ng-hub-ui-nav**](https://www.npmjs.com/package/ng-hub-ui-nav)
- [**ng-hub-ui-paginable**](https://www.npmjs.com/package/ng-hub-ui-paginable)
- [**ng-hub-ui-panels**](https://www.npmjs.com/package/ng-hub-ui-panels)
- [**ng-hub-ui-portal**](https://www.npmjs.com/package/ng-hub-ui-portal)
- [**ng-hub-ui-skeleton**](https://www.npmjs.com/package/ng-hub-ui-skeleton)
- [**ng-hub-ui-sortable**](https://www.npmjs.com/package/ng-hub-ui-sortable)
- [**ng-hub-ui-stepper**](https://www.npmjs.com/package/ng-hub-ui-stepper)
- [**ng-hub-ui-utils**](https://www.npmjs.com/package/ng-hub-ui-utils)

---

## 🚀 Inicio rápido

### 1. Instalar

```bash
npm install ng-hub-ui-forms
```

`@angular/cdk` es una peer dependency (la usan el overlay del datepicker y el select):

```bash
npm install @angular/cdk
```

### 2. Importar

Los campos son standalone — importa solo lo que uses:

```ts
import { HubInputComponent, HubSelectComponent } from 'ng-hub-ui-forms';
```

### 3. Usar

```html
<form [formGroup]="form" hubForm (submit)="save()">
	<hub-input formControlName="email" type="email" label="Email" required />
	<hub-select formControlName="country" label="Country" [items]="countries" bindLabel="name" bindValue="code" />
	<button type="submit">Save</button>
</form>
```

El campo `email` (requerido) muestra su error automáticamente al enviar — sin
escribir a mano `@if (control.invalid && control.touched)`.

---

## 📦 Descripción

`ng-hub-ui-forms` unifica un conjunto de campos accesibles bajo un único contrato:
los vinculas con **Reactive Forms** y los errores de validación aparecen
**automáticamente** a nivel de control, grupo y formulario. Los campos son
standalone, `OnPush` y signal-native; el select es un fork mantenido de
[ng-select](https://github.com/ng-select/ng-select) (ver [Créditos](#-créditos));
el datepicker está construido desde cero sobre `Date` nativo y el overlay del CDK
de Angular. Todo se tematiza con variables CSS canónicas `--hub-*` con modo oscuro
en tiempo de ejecución — sin dependencia de Bootstrap.

## 🎯 Características

- **Campos** — `hub-input` (text/number/email/password/color/switch/checkbox/counter, con addons de input-group y máscaras, afijos de icono dentro del campo y `search` typeahead con debounce; el formato `file` está **deprecado** → usa `hub-file-input`), `hub-otp-input`, `hub-textarea` (+ `hubAutoresize`), `hub-slider` (uno / dos thumbs, relleno con degradado), `hub-segmented` (campo de control segmentado — selección simple y múltiple, horizontal y vertical, con label + validación), `hub-select` (formato dropdown, agrupación, typeahead, templates personalizados; los formatos `buttons` / `checkbox` / `radio` están **deprecados** → usa `hub-segmented`), `hub-datepicker` (simple y rango, navegación por teclado, i18n), `hub-file-input` (arrastrar y soltar, pegado desde el portapapeles, límites de tipo y tamaño, previsualización, progreso de subida opcional).
- **Visualización automática de errores** — vinculas un campo y sus errores de control se renderizan debajo; `hub-fieldset`, `form[hubForm]` y `hub-legend` muestran los errores de grupo y de formulario (cross-field) igual, sin cableado.
- **Contenedores** — `hub-fieldset` / `form[hubForm]` agrupan campos y muestran sus errores de grupo; `hub-legend` renderiza una leyenda accesible.
- **Configurable** — `provideHubForms({ … })` define las plantillas de invalid-feedback, locale/labels del datepicker, los textos del file input y más, a nivel de app o por instancia.
- **Validadores y helpers** — validador cross-field `hubAreEqual`, los validadores de ficheros (`hubAcceptedFiles`, `hubMaxFileSize`, `hubMinFileSize`, `hubMaxTotalSize`, `hubMaxFiles`, `hubMinFiles`), directivas de proyección `hubValidationError` / `hubFormText`, y un conjunto de pipes de utilidad.
- **Listo para Signal Forms** — un entry point secundario opt-in [`ng-hub-ui-forms/signals`](#-signal-forms-opt-in) integra Angular Signal Forms; el núcleo sigue basado en Reactive Forms y compatible con Angular 21.
- **Theming** — cada color, borde, radio y espaciado es una variable CSS `--hub-*`; incluye tokens SCSS compartidos para los consumidores.

---

## 📦 Instalación

```bash
npm install ng-hub-ui-forms @angular/cdk
```

### Peer dependencies

```json
{
	"@angular/cdk": ">=21.0.0",
	"@angular/common": ">=21.0.0",
	"@angular/core": ">=21.0.0",
	"@angular/forms": ">=21.0.0",
	"@angular/platform-browser": ">=21.0.0"
}
```

---

## ⚙️ Uso

### Input

```html
<hub-input formControlName="email" type="email" label="Email" required />
<hub-input formControlName="amount" type="number" label="Amount" />
<hub-input formControlName="darkMode" format="switch" label="Dark mode" />
```

#### Afijo de icono y typeahead (buscadores)

Proyecta un icono inicial o final **dentro** del campo, emite el término con _debounce_ en cada pulsación y deja que el campo pinte su propio botón de limpiar:

```html
<!-- Proyecta cualquier icono (cualquier pack con el atajo) + búsqueda con debounce + limpiar integrado -->
<hub-input
	label="Buscar frameworks"
	[clearable]="true"
	[debounceTime]="300"
	(search)="onSearch($event)"
>
	<hub-icon hubInputPrefix name="fa:solid:magnifying-glass" />
</hub-input>

<!-- Afijos proyectados para cualquier contenido (una unidad, un SVG inline…) -->
<hub-input label="Importe">
	<span hubInputPrefix>€</span>
</hub-input>
```

- Proyecta un `<hub-icon>` (o cualquier elemento) en `hubInputPrefix` / `hubInputSuffix`; el campo lo tematiza con sus tokens `--hub-input-icon-*`.
- `[clearable]` pinta un botón ✕ interno cuando el campo tiene valor — limpia el control y emite un término de `search` vacío (sin cablear un suffix a mano). El glyph es el token intercambiable `--hub-input-clear-icon`.
- El control reserva el _padding_ interior automáticamente para que su texto nunca quede bajo el afijo.
- Los afijos usan propiedades lógicas de CSS, así que `start`/`end` siguen la dirección de escritura y **se voltean solos con `dir="rtl"`**.
- `(search)` se dispara `debounceTime` ms después de dejar de escribir (`0` = cada pulsación); los términos consecutivos idénticos se omiten y `valueChange` sigue siendo síncrono.

### Select

```html
<!-- items de objeto -->
<hub-select formControlName="country" label="Country" [items]="countries" bindLabel="name" bindValue="code" />

<!-- múltiple + typeahead -->
<hub-select formControlName="tags" label="Tags" [items]="tags" [multiple]="true" [searchable]="true" />

<!-- agrupado -->
<hub-select formControlName="city" label="City" [items]="cities" bindLabel="name" bindValue="id" groupBy="country" />
```

Los templates de opción/etiqueta se proyectan directamente al motor:

```html
<hub-select formControlName="assignee" [items]="people" bindLabel="name">
	<ng-template ng-label-tmp let-item="item">{{ item.emoji }} {{ item.name }}</ng-template>
	<ng-template ng-option-tmp let-item="item"><strong>{{ item.name }}</strong> — {{ item.role }}</ng-template>
</hub-select>
```

> Importa `NgOptionTemplateDirective` / `NgLabelTemplateDirective` de `ng-hub-ui-forms`.
> El panel del dropdown se renderiza al `body` por defecto (`appendTo`), así que nunca lo recortan tarjetas ni contenedores con scroll.

### Datepicker

```html
<hub-datepicker formControlName="date" label="Date" />
<hub-datepicker formControlName="range" mode="range" label="Stay" />
```

### File input

Arrastrar y soltar, pegado desde el portapapeles, restricciones y previsualización. El valor del control es nativo — un `File`, un `File[]` o `null` — así que va directo a un `FormData`.

```html
<hub-file-input
	formControlName="attachments"
	label="Attachments"
	[multiple]="true"
	accept="image/*,.pdf"
	[maxSize]="5 * 1024 * 1024"
	[maxFiles]="3"
	preview="grid"
	(rejected)="notify($event)"
/>
```

`accept`, `maxSize`, `maxFiles` y compañía **filtran**: un fichero que incumple no llega nunca al valor y aparece en `(rejected)` con un motivo tipado. Se aplican a mano, porque el atributo `accept` nativo solo filtra el diálogo del sistema operativo — soltar o pegar lo esquiva. Para que además el *control* quede inválido (conviene cuando el valor también puede llegar por `patchValue`), añade los validadores correspondientes:

```ts
new FormControl<File[]>([], [hubMaxFiles(3), hubMaxFileSize(5 * 1024 * 1024), hubAcceptedFiles('image/*,.pdf')]);
```

La subida es opcional y agnóstica del transporte. Implementa el contrato en tu aplicación — la librería nunca trae un endpoint — y el campo pinta progreso, cancelar y reintentar por fichero:

```ts
@Injectable({ providedIn: 'root' })
export class ApiFileUploader implements HubFileUploader {
	readonly #http = inject(HttpClient);

	upload(file: File): Observable<HubFileUploadEvent> {
		const body = new FormData();
		body.append('file', file);

		return this.#http.post('/api/files', body, { reportProgress: true, observe: 'events' }).pipe(
			map((event) => {
				if (event.type === HttpEventType.UploadProgress) {
					// `total` es undefined cuando no se conoce el tamaño: pasa null, no 0, para que la
					// barra se pinte indeterminada en vez de parecer atascada.
					return { status: 'progress', loaded: event.loaded, total: event.total ?? null } as const;
				}
				if (event.type === HttpEventType.Response) {
					return { status: 'done', response: event.body } as const;
				}
				return null;
			}),
			filter((event) => event !== null),
			catchError((error) => of({ status: 'error', error } as const))
		);
	}
}

bootstrapApplication(App, { providers: [provideHttpClient(), provideHubFileUploader(ApiFileUploader)] });
```

> El observable **debe ser frío**: una suscripción es una petición. `cancel()` se desuscribe, y eso es lo que aborta el `XMLHttpRequest` subyacente. Un observable caliente o compartido rompe la cancelación en silencio.
> Si necesitas esperar a que terminen las subidas, engancha el botón de envío a `uploading()`: el control sigue siendo válido mientras se suben, por diseño.

Lo que el uploader devuelva en `done` se conserva en el item, así que los ids que acuñó el servidor están ahí cuando envías el formulario:

```ts
const uploadedIds = fileInput.files().map((item) => (item.response as { id: string }).id);
```

Se personaliza sin tocar la plantilla: los tokens `--hub-file-input-*` (cada icono es una máscara CSS intercambiable), el mixin `hub-file-input-theme(...)` y tres slots de proyección.

El dropzone se compone de un glifo, una invitación y una acción de examinar, cada uno tematizable por separado — así un design system reproduce el suyo sin bifurcar la plantilla: el **medallón del icono** (`--hub-file-input-icon-bg`, `-icon-chip-size`, `-icon-chip-radius`), el **botón de examinar** (`--hub-file-input-browse-bg`, `-hover-bg`, `-padding-x/-y`, `-radius` y un glifo delantero opcional), la **segunda línea de invitación** (`[dropText]` / `[dropSubtext]`, apiladas con `--hub-file-input-prompt-direction: column`) y un **aviso** proyectado entre el glifo y la invitación con `hubFileDropzoneNotice`. Todos los valores por defecto dejan el dropzone exactamente como estaba.

```html
<hub-file-input formControlName="attachments" [multiple]="true">
	<ng-template hubFileIcon let-item>
		<hub-icon [name]="item.file.type === 'application/pdf' ? 'fa:solid:file-pdf' : 'fa:solid:file'" />
	</ng-template>
</hub-file-input>
```

### Errores automáticos en todos los niveles

```html
<form [formGroup]="form" hubForm (submit)="save()">
	<hub-fieldset legend="Credentials">
		<hub-input formControlName="email" type="email" label="Email" required />
		<hub-input formControlName="confirm" type="email" label="Confirm email" required />
	</hub-fieldset>
	<button type="submit">Create account</button>
</form>
```

```ts
form = new FormGroup(
	{ email: new FormControl('', Validators.required), confirm: new FormControl('') },
	{ validators: hubAreEqual('email', 'confirm') }
);
```

Al enviar, cada campo inválido muestra su error y el error cross-field de
`hubAreEqual` lo muestra el fieldset/form — sin marcado de errores manual.

### Estados de validación (el inválido es automático, el válido es opt-in)

El estado **inválido** siempre es automático: un campo tocado e inválido muestra
su estilo de error y su mensaje sin configuración. El estado **válido / de éxito**
es estrictamente **opt-in** — el éxito *nunca* se muestra automáticamente. Actívalo
por campo con el input `showValid` y, opcionalmente, añade un mensaje
`validFeedback` que se renderiza debajo del control cuando el campo está tocado y es
válido:

```html
<hub-input formControlName="username" label="Username" required [showValid]="true" validFeedback="Looks good!" />
```

Para activar el estado de éxito en todos los campos a la vez, configúralo de forma
global — consulta [Configuración](#-configuración). Un `showValid` por campo
siempre tiene prioridad sobre el valor por defecto global.

---

## 🛠️ Configuración

Define valores por defecto a nivel de app (copy de invalid-feedback, locale/labels del datepicker…):

```ts
import { provideHubForms } from 'ng-hub-ui-forms';

bootstrapApplication(AppComponent, {
	providers: [
		provideHubForms({
			showValid: true,
			datepicker: { firstDayOfWeek: 1, displayFormat: 'dd/MM/yyyy' }
		})
	]
});
```

`showValid` (por defecto `false`) activa el estado opt-in válido/de éxito en todos
los campos cuando están tocados y son válidos. El estado inválido no se ve afectado
— siempre es automático; solo el éxito queda detrás de este flag. Un input
`showValid` por campo tiene prioridad sobre el valor por defecto global.

---

## 🎨 Estilos

Todo se tematiza con variables CSS `--hub-*`. El paquete incluye tokens SCSS
compartidos; impórtalos una vez en la raíz de la app:

```scss
@use 'ng-hub-ui-forms/src/lib/styles/index' as hub-forms;
```

```css
hub-input,
hub-select {
	--hub-input-border-color: #cbd5e1;
	--hub-select-option-selected-bg: #e0e7ff;
}
```

El estado opt-in válido/de éxito se tematiza con cuatro tokens (encadenados por
defecto a la familia `--hub-sys-color-success`):

```css
hub-input {
	--hub-form-valid-color: #198754;
	--hub-form-valid-border-color: #198754;
	--hub-form-valid-focus-ring-color: rgba(25, 135, 84, 0.25);
	--hub-form-valid-feedback-color: #198754;
}
```

**`hub-slider`** — `--hub-slider-track-fill` acepta un `<image>` completo (p. ej. un `linear-gradient(to right, …)`) para la parte rellena de la pista, que se renderiza intacto recortado al porcentaje actual; `--hub-slider-value-space` es el hueco de la burbuja de valor y colapsa a `0` en un slider `[showValue]="false"` (flush):

```css
.gradient-slider {
	--hub-slider-track-fill: linear-gradient(to right, #22c55e, #eab308, #ef4444);
}
```

**`hub-select` dentro de un modal** — el panel del desplegable se apila con `--hub-select-dropdown-zindex` (por defecto `calc(var(--hub-sys-zindex-modal, 1055) + 5)`; la grafía anterior `--hub-select-dropdown-z-index` queda deprecada pero se sigue respetando), así que un select abierto dentro de un `HubModal` se renderiza por encima del diálogo en vez de quedar recortado debajo.

**Variantes y theming de `hub-segmented`** — el input `color` tiñe el segmento seleccionado desde las familias semánticas (`<hub-segmented color="primary">`); puedes fijar cualquier slot `--hub-segmented-*` directamente, o en una llamada con el mixin SCSS:

```scss
@use 'ng-hub-ui-forms/styles' as *;

.brand-toggle {
	@include hub-segmented-theme($selected-bg: gold, $selected-color: #111, $radius: 999px);
}
```

En modo single, la píldora seleccionada se desliza entre opciones (`--hub-segmented-indicator-transition`, por defecto `0.2s ease`; desactivado con `prefers-reduced-motion`).

---

## ✨ Signal Forms (opt-in)

`ng-hub-ui-forms/signals` es un entry point secundario — el único sitio que importa
`@angular/forms/signals`, de modo que el núcleo sigue siendo compatible con Angular
21. Recomendado en Angular ≥ 22.

```ts
import { HubSignalFieldControl, hubSignalErrorMessages } from 'ng-hub-ui-forms/signals';
```

---

## ♿ Accesibilidad

- Las etiquetas se asocian con su control (`for`/`id`); los campos requeridos se marcan.
- Los errores de validación se renderizan en una región `role="alert"` ligada al campo.
- El select expone la semántica combobox/listbox correcta; el datepicker es totalmente navegable por teclado.

---

## 📊 Changelog

Consulta [CHANGELOG.md](./CHANGELOG.md).

---

## 🙏 Créditos

`hub-select` es un **fork mantenido de [ng-select](https://github.com/ng-select/ng-select)**, obra de los contribuidores de ng-select. Las fuentes `src/ng-select` upstream se incluyen (vendored) en el propio paquete y se re-tematizan con tokens `--hub-*` — fijadas a la versión upstream **`v23.0.1`** (registrada en [`src/lib/select/UPSTREAM`](./src/lib/select/UPSTREAM); las desviaciones se documentan en [`src/lib/select/PATCHES.md`](./src/lib/select/PATCHES.md)). ng-select se distribuye bajo la [Licencia MIT](https://github.com/ng-select/ng-select/blob/master/LICENSE.md), y se conservan los avisos de copyright originales en los ficheros vendored.

El datepicker, los inputs y la capa de validación son originales de `ng-hub-ui-forms`.

---

## 📄 Licencia

MIT © [Carlos Morcillo](https://www.carlosmorcillo.com)
