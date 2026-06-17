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
standalone, `OnPush` y signal-native; el select es un fork mantenido de ng-select;
el datepicker está construido desde cero sobre `Date` nativo y el overlay del CDK
de Angular. Todo se tematiza con variables CSS canónicas `--hub-*` con modo oscuro
en tiempo de ejecución — sin dependencia de Bootstrap.

## 🎯 Características

- **Campos** — `hub-input` (text/number/email/password/color/switch/checkbox/counter, con addons de input-group y máscaras), `hub-otp-input`, `hub-textarea` (+ `hubAutoresize`), `hub-slider`, `hub-select` (formatos dropdown / buttons / checkbox / radio, agrupación, typeahead, templates personalizados), `hub-datepicker` (simple y rango, navegación por teclado, i18n).
- **Visualización automática de errores** — vinculas un campo y sus errores de control se renderizan debajo; `hub-fieldset`, `form[hubForm]` y `hub-legend` muestran los errores de grupo y de formulario (cross-field) igual, sin cableado.
- **Contenedores** — `hub-fieldset` / `form[hubForm]` agrupan campos y muestran sus errores de grupo; `hub-legend` renderiza una leyenda accesible.
- **Configurable** — `provideHubForms({ … })` define las plantillas de invalid-feedback, locale/labels del datepicker y más, a nivel de app o por instancia.
- **Validadores y helpers** — validador cross-field `hubAreEqual`, directivas de proyección `hubValidationError` / `hubFormText`, y un conjunto de pipes de utilidad.
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

---

## 🛠️ Configuración

Define valores por defecto a nivel de app (copy de invalid-feedback, locale/labels del datepicker…):

```ts
import { provideHubForms } from 'ng-hub-ui-forms';

bootstrapApplication(AppComponent, {
	providers: [
		provideHubForms({
			datepicker: { firstDayOfWeek: 1, displayFormat: 'dd/MM/yyyy' }
		})
	]
});
```

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
	--hub-field-border-color: #cbd5e1;
	--hub-select-option-selected-bg: #e0e7ff;
}
```

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

## 📄 Licencia

MIT © [Carlos Morcillo](https://www.carlosmorcillo.com)
