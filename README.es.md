# ng-hub-ui-forms

**Español** | [English](./README.md)

Campos de formulario accesibles y **basados en signals** para Angular — input,
textarea, slider, select y datepicker — con **visualización automática de errores
de validación** para controles, `FormGroup` y `FormArray`. Reactive Forms hoy,
listo para Signal Forms. Tematizado por completo con variables CSS `--hub-*`, sin
Bootstrap.

## Documentación y ejemplos en vivo

Este paquete forma parte de [Hub UI](https://hubui.dev/en/), una colección de bibliotecas de componentes Angular para aplicaciones standalone.

- Documentación: https://hubui.dev/en/forms/overview/
- Ejemplos en vivo: https://hubui.dev/en/forms/examples/
- Hub UI: https://hubui.dev/en/

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

`ng-hub-ui-utils` es una peer dependency (el datepicker abre su panel con su servicio de
overlay y todos los campos pintan el texto de ayuda en tooltip con `hubTooltip`):

```bash
npm install ng-hub-ui-utils
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
el datepicker está construido desde cero sobre `Date` nativo y el overlay de
`ng-hub-ui-utils`. Todo se tematiza con variables CSS canónicas `--hub-*` con modo oscuro
en tiempo de ejecución — sin dependencia de Bootstrap.

## 🎯 Características

- **Campos** — `hub-input` (text/number/email/password/color/switch/checkbox/counter, con addons de input-group y máscaras, afijos de icono dentro del campo, el estado mixto `indeterminate` en checkboxes y `search` typeahead con debounce; el formato `file` está **deprecado** → usa `hub-file-input`), `hub-otp-input`, `hub-textarea` (+ `hubAutoresize`), `hub-slider` (uno / dos thumbs, relleno con degradado), `hub-segmented` (campo de control segmentado — selección simple y múltiple, horizontal y vertical, con label + validación), `hub-select` (formato dropdown, agrupación, búsqueda en cliente vía `searchable` **y** typeahead asíncrono en servidor vía un Subject `typeahead`, creación de tags con `addTag`, templates personalizados, addons de grupo `prepend` / `append` e iconos/botones acoplados vía `hubPrepend` / `hubAppend`; los formatos `buttons` / `checkbox` / `radio` están **deprecados** → usa `hub-segmented`), `hub-datepicker` (simple y rango en cualquier granularidad, del año al segundo, selección de hora, min/max al minuto, navegación por teclado, i18n), `hub-timepicker` (una hora del día como `HH:MM`, sobre el control de hora de la plataforma, con `min` / `max` / `step`), `hub-file-input` (arrastrar y soltar, pegado desde el portapapeles, límites de tipo y tamaño, previsualización, progreso de subida opcional).
- **Visualización automática de errores** — vinculas un campo y sus errores de control se renderizan debajo; `fieldset[hubFieldset]`, `form[hubForm]` y `hub-legend` muestran los errores de grupo y de formulario (cross-field) igual, sin cableado.
- **Contenedores** — `fieldset[hubFieldset]` (o el elemento `<hub-fieldset>`) / `form[hubForm]` agrupan campos y muestran sus errores de grupo; `hub-legend` renderiza una leyenda accesible.
- **Configurable** — `provideHubForms({ … })` define las plantillas de invalid-feedback, locale/labels del datepicker, los textos del file input y más, a nivel de app o por instancia.
- **Validadores y helpers** — validador cross-field `hubAreEqual`, los validadores de ficheros (`hubAcceptedFiles`, `hubMaxFileSize`, `hubMinFileSize`, `hubMaxTotalSize`, `hubMaxFiles`, `hubMinFiles`), directivas de proyección `hubValidationError` / `hubFormText`, y un conjunto de pipes de utilidad.
- **Listo para Signal Forms** — un entry point secundario opt-in [`ng-hub-ui-forms/signals`](#-signal-forms-opt-in) integra Angular Signal Forms; el núcleo sigue basado en Reactive Forms y compatible con Angular 21.
- **Theming** — cada color, borde, radio y espaciado es una variable CSS `--hub-*`; incluye tokens SCSS compartidos para los consumidores.
- **Adaptador entre librerías** — `hubFormControlAdapter` permite que otras librerías rendericen `hub-input` / `hub-select` sin depender de este paquete (más abajo).
- **De derecha a izquierda** — todos los campos se voltean con `dir="rtl"`: las primitivas usan propiedades lógicas de CSS, y las tres cuya geometría solo es CSS a medias se tratan aparte — el slider (un `range` nativo se voltea, pero la imagen de fondo que rellena su pista no), el switch (su pomo y la transición que lo nombra van juntos) y el control segmentado, que vuelve a medir su indicador cuando cambia la dirección, porque un volteo recoloca las opciones sin cambiar el tamaño de nada.

---

## 🔌 Adaptador entre librerías (`hubFormControlAdapter`)

Otras librerías de ng-hub-ui pueden alojar los controles de forms **sin depender en
firme** de `ng-hub-ui-forms`. Exponen un token opcional; conectas una vez el
`hubFormControlAdapter` ya construido y sus controles primitivos pasan a ser
`hub-input` / `hub-select`. Por ejemplo, la tabla de `ng-hub-ui-paginable`:

```ts
import { provideHubPaginableFormControls } from 'ng-hub-ui-paginable';
import { hubFormControlAdapter } from 'ng-hub-ui-forms';

export const appConfig: ApplicationConfig = {
	providers: [provideHubPaginableFormControls(hubFormControlAdapter)]
};
```

El adaptador crea los componentes dinámicamente y hace de puente entre el valor que
entra y el cambio que sale; necesita `provideHubForms()` o la configuración por
defecto en el entorno. Ver la sección [Sinergias y agnosticidad](../../README.es.md#sinergias-y-agnosticidad)
de toda la familia.

---

## 📦 Instalación

```bash
npm install ng-hub-ui-forms ng-hub-ui-utils
```

### Peer dependencies

```json
{
	"@angular/common": ">=21.0.0",
	"@angular/core": ">=21.0.0",
	"@angular/forms": ">=21.0.0",
	"@angular/platform-browser": ">=21.0.0",
	"ng-hub-ui-utils": ">=22.12.0"
}
```

---

## ⚙️ Uso

### Texto de ayuda

Todos los campos aceptan `formText`, y `formTextType` dice dónde va.

```html
<!-- una frase: debajo, donde se lee sin tener que pedirla -->
<hub-input label="Nombre" formText="Tal como aparece en la tarjeta." />

<!-- más de una: tras un signo de interrogación al final de la fila de la etiqueta -->
<hub-input
	label="IBAN"
	formTextType="tooltip"
	formText="La cuenta en la que se abona la devolución. Debe pertenecer al titular de la tarjeta: una transferencia a un tercero la rechaza el banco."
/>
```

La regla que zanja esto es **una frase debajo, más de una en el tooltip**. Un párrafo bajo cada campo
convierte el formulario en un documento, empuja el siguiente campo fuera de la pantalla y no lo lee
nadie que ya supiera para qué servía el campo.

El signo se empuja al final de la fila de la etiqueta, así que una columna de campos alinea sus
interrogaciones en vez de esparcirlas allí donde termine cada etiqueta. Es un `<button>` **junto** a
la etiqueta y nunca dentro: activar una etiqueta enfoca el control que nombra, así que un signo
anidado en ella abriría el tooltip _y_ metería el cursor en el campo. Su nombre accesible es el
propio texto de ayuda.

`formTextType="tooltip"` necesita la hoja de estilos del tooltip, que este paquete no arrastra por ti:

```scss
@use 'ng-hub-ui-utils/styles/tooltip';
```

Una plantilla proyectada con `hubFormText` conserva su bloque de abajo incluso en modo tooltip: el
tooltip recibe una cadena, así que pedirle que lleve marcado lo descartaría en silencio.

### Input

```html
<hub-input formControlName="email" type="email" label="Email" required />
<hub-input formControlName="amount" type="number" label="Amount" />
<hub-input formControlName="darkMode" type="switch" label="Dark mode" />
```

#### Afijo de icono y typeahead (buscadores)

Proyecta un icono inicial o final **dentro** del campo, emite el término con _debounce_ en cada pulsación y deja que el campo pinte su propio botón de limpiar:

```html
<!-- Proyecta cualquier icono (cualquier pack con el atajo) + búsqueda con debounce + limpiar integrado -->
<hub-input label="Buscar frameworks" [clearable]="true" [debounceTime]="300" (search)="onSearch($event)">
	<hub-icon hubInputPrefix name="fa:solid:magnifying-glass" />
</hub-input>

<!-- Afijos proyectados para cualquier contenido (una unidad, un SVG inline…) -->
<hub-input label="Importe">
	<span hubInputPrefix>€</span>
</hub-input>
```

- Proyecta un `<hub-icon>` (o cualquier elemento) en `hubInputPrefix` / `hubInputSuffix`; el campo lo tematiza con sus tokens `--hub-input-icon-*`.
- `[(indeterminate)]` pone un `checkbox` en estado mixto — la respuesta honesta para un «seleccionar todo» sobre una lista parcialmente marcada. Refleja la propiedad nativa del DOM, así que se anuncia como mixto, y es bidireccional: al pulsar un checkbox mixto se elige un lado, así que el componente lo limpia y te lo comunica. El formato `switch` lo ignora.
- `[clearable]` pinta un botón ✕ interno cuando el campo tiene valor — limpia el control y emite un término de `search` vacío (sin cablear un suffix a mano). El glyph es el token intercambiable `--hub-input-clear-icon`.
- El control reserva el _padding_ interior automáticamente para que su texto nunca quede bajo el afijo.
- Los afijos usan propiedades lógicas de CSS, así que `start`/`end` siguen la dirección de escritura y **se voltean solos con `dir="rtl"`**.
- `(search)` se dispara `debounceTime` ms después de dejar de escribir (`0` = cada pulsación); los términos consecutivos idénticos se omiten y `valueChange` sigue siendo síncrono.

#### Campos de contraseña

`type="password"` renderiza un campo enmascarado con un botón integrado para mostrar/ocultar dentro del input-group (un addon final, no un botón suelto):

```html
<hub-input formControlName="password" type="password" label="Password" autocomplete="new-password" passwordStrength />
```

- `[(passwordRevealed)]` — modelo bidireccional del estado de visibilidad; contrólalo desde fuera o léelo.
- `passwordToggle` (por defecto `true`) — ponlo a `false` para ocultar el botón integrado.
- `hideOnBlur` (por defecto `true`) — una contraseña revelada se vuelve a ocultar automáticamente al perder el foco el campo.
- `capsLockWarning` (por defecto `true`) — muestra un aviso bajo el campo mientras Bloq Mayús está activo.
- `passwordStrength` (por defecto `false`) — medidor de fortaleza opcional de 4 segmentos, calculado con el heurístico exportado `scorePasswordStrength` (longitud ≥ 8, mayúsculas y minúsculas, dígito, símbolo) salvo que se sobrescriba.
- `autocomplete` — atributo nativo para gestores de contraseñas, p. ej. `current-password` / `new-password`.
- Los campos de contraseña en modo readonly permanecen enmascarados (ya no fuerzan `type="text"`); un clic explícito en el toggle puede seguir revelándolos.

Las etiquetas y el _scorer_ de fortaleza son localizables a nivel de app mediante `provideHubForms`:

```ts
provideHubForms({
	password: {
		showPasswordLabel: 'Show password',
		hidePasswordLabel: 'Hide password',
		capsLockWarning: 'Caps Lock is on',
		strengthLabels: ['Weak', 'Fair', 'Good', 'Strong'],
		strengthFn: (value) => myCustomScorer(value) // opcional, 0-4
	}
});
```

#### Campos en texto plano

`readonly` y `plaintext` son las dos mitades de un campo cerrado, y la diferencia está en para
quién es el campo. `readonly` es un _estado_ de un campo que alguien sigue rellenando, y un tema
puede darle caja: `--hub-input-readonly-bg`, `--hub-input-readonly-border-color`, `-color` y
`-cursor` están para ajustarse. `plaintext` es para un valor que solo se _muestra_ —un registro
abierto para consulta, una cifra que fijó el servidor, un campo que un plan ha bloqueado—. Ahí
la caja es ruido, y no tenerla es lo que `plaintext` _es_, no un color que le haya tocado.

> **Con los valores por defecto, `readonly` ya no dibuja caja**: los dos tokens valen
> `transparent`, y es deliberado — un valor de solo lectura está para leerse y solo pierde el
> cromo que promete que puedes escribir en él. Sin tocar nada, los dos se diferencian en el
> relleno horizontal (12px frente a 0), la anchura del borde lateral, el cursor y las
> affordances. Fija los dos tokens y el modo lectura recupera la caja que trae el `readonly` de
> Bootstrap, mientras `plaintext` sigue plano:
>
> ```css
> .hub-field--readonly {
> 	--hub-input-readonly-bg: var(--hub-sys-surface-sunken);
> 	--hub-input-readonly-border-color: var(--hub-sys-border-subtle);
> }
> ```

El valor retrocede un tono. Dentro de una caja, la caja hace la separación; sin ella, etiqueta y
valor tenían el mismo color y dos píxeles de diferencia de tamaño, así que una columna de ellos se
leía como líneas indistinguibles. La etiqueta se deja exactamente como la de cualquier otro campo
—mismos tokens, mismo peso, porque las etiquetas de un formulario mantienen un solo ritmo sea cual
sea el estado de cada campo— y es `--hub-input-plaintext-color` el que mueve el valor, a `gray-700`
frente al `gray-900` editable, con `--hub-input-plaintext-font-weight` un paso más ligero para
que no compita con su propia etiqueta.

El relleno vertical se desplaza en vez de encogerse, con `--hub-input-plaintext-padding-block`:
nada arriba y todo el relleno vertical del campo abajo. Nada arriba deja el valor justo debajo de
su etiqueta —una etiqueta y su valor son una sola cosa y deben leerse como pareja— mientras que el
doble del relleno abajo mantiene el control exactamente a la altura de un campo editable, así que
una rejilla que mezcle los dos sigue cuadrando. Si lo sustituyes por un solo valor, renuncias a
una de las dos cosas.

```html
<!-- se está rellenando, así que conserva la caja -->
<hub-input formControlName="reference" label="Referencia" [readonly]="true" />

<!-- solo se está leyendo, así que la caja sobra -->
<hub-input formControlName="customer" label="Cliente" [plaintext]="true" />
<hub-textarea formControlName="notes" label="Notas" [rows]="3" [plaintext]="true" />
```

Está modelado sobre el `.form-control-plaintext` de Bootstrap, y es deliberado: el control sigue
siendo un `<input>` / `<textarea>` real, así que el `<label for>` sigue apuntando a algo
etiquetable y el texto se puede seleccionar. Un `<span>` habría roto las dos cosas sin dejar de
parecer correcto.

El relleno horizontal desaparece y el borde se vuelve transparente **sin perder su anchura**, de
modo que un valor en texto plano cae sobre la misma línea base que un vecino editable y un
formulario que mezcla los dos no se escalona. `plaintext` implica `readonly` y las dos
presentaciones son excluyentes, así que nunca pueden pasarse en desacuerdo. Todas las
affordances se van con la caja: el botón de limpiar, un caret proyectado, el icono de un
datepicker y el contador de caracteres de un textarea, que dice cuánto espacio queda para
escribir y por tanto promete que se puede escribir.

### Select

```html
<!-- items de objeto -->
<hub-select formControlName="country" label="Country" [items]="countries" bindLabel="name" bindValue="code" />

<!-- múltiple + búsqueda en cliente (searchable filtra los items ya cargados mientras escribes) -->
<hub-select formControlName="tags" label="Tags" [items]="tags" [multiple]="true" [searchable]="true" />

<!-- agrupado -->
<hub-select formControlName="city" label="City" [items]="cities" bindLabel="name" bindValue="id" groupBy="country" />
```

#### Etiqueta flotante

```html
<hub-select
	formControlName="country"
	labelType="floating"
	label="Country"
	[items]="countries"
	bindLabel="name"
	bindValue="code"
/>
```

La etiqueta se coloca dentro del control y sube al enfocarlo o al tener valor, con el mismo
recorrido que `hub-input` — de modo que un formulario puede flotar todas sus etiquetas en vez
de flotar los campos de texto y apilar los selects que van al lado. Si además se pasa un
`placeholder`, solo se muestra cuando la etiqueta ya ha subido: hasta entonces la etiqueta
está ocupando su sitio.

Solo flota el formato `dropdown`. Los formatos obsoletos `buttons` / `checkbox` / `radio` no
tienen caja donde flotar y conservan la etiqueta apilada.

`hub-datepicker` flota igual, y lo gobierna desde el estado del campo y no desde `:focus`: su
calendario es un overlay, así que al abrirlo el foco sale del input, y una etiqueta gobernada
por la pseudoclase volvería a caer sobre el valor justo cuando lo estás usando.

La geometría es común a los tres a través de tres tokens, de modo que flotan igual y se ajustan
en un solo sitio: `--hub-field-floating-inset` (cuánto baja el valor),
`--hub-field-floating-travel` (cuánto sube la etiqueta) y `--hub-field-floating-scale`.

#### Addons y contenido acoplado

`prepend` / `append` son addons de grupo que llevan **texto** — una moneda, una unidad, un
protocolo. Disponibles en `hub-input`, `hub-select`, `hub-textarea`, `hub-datepicker` y `hub-timepicker`: todos los
campos que se dibujan como una caja con un valor.

```html
<hub-input formControlName="amount" label="Amount" prepend="€" append=".00" />
<hub-textarea formControlName="notes" label="Notes" append="Markdown" />
```

Para un **icono o un botón** —algo más rico que texto— se proyecta una plantilla `[hubPrepend]` /
`[hubAppend]`. Ambos se combinan: las cadenas se renderizan primero, así que lo proyectado queda
siempre en el extremo de su lado. La unidad rotula el campo; la acción va más allá.

```html
<hub-input formControlName="query" label="Buscar">
	<ng-template hubAppend>
		<button type="button" aria-label="Buscar" (click)="buscar()">
			<hub-icon name="fa:solid:magnifying-glass" />
		</button>
	</ng-template>
</hub-input>
```

Un slot también puede llevar un **campo**, no sólo una acción. Un precio y el periodo del que es
precio son una sola afirmación —«180 € al mes»— y repartirla en dos campos obliga a recomponerla
en cada fila.

```html
<hub-input formControlName="rate" label="Tarifa" prepend="€">
	<ng-template hubAppend>
		<hub-select
			formControlName="period"
			[items]="periods"
			bindLabel="name"
			bindValue="id"
			[clearable]="false"
			placeholder="por"
		/>
	</ng-template>
</hub-input>
```

`hub-input`, `hub-select`, `hub-textarea`, `hub-datepicker` y `hub-timepicker` son los cinco que cierran a ras, y
sólo como **hijo directo** de la plantilla: envuelve uno en un `<div>` y recibe el trato de una
acción.

Lo proyectado lleva el borde, el radio y la altura del campo, no los suyos, de modo que un botón
no dibuja una segunda costura más gruesa junto al control. Un campo proyectado lo cede un nivel
más adentro —su host renuncia al borde y el control interior recibe el cuadrado— porque un campo
guarda su caja en el control, no en su host.

> Importa `HubPrependDirective` / `HubAppendDirective` de `ng-hub-ui-forms`.
> `[hubSelectSuffix]` queda **deprecado** en favor de `[hubAppend]`, que hace lo mismo en todos los
> campos y no sólo en el select.

### Datepicker

```html
<hub-datepicker formControlName="date" label="Date" /> <hub-datepicker formControlName="range" mode="range" label="Stay" />
```

`granularity` define con qué precisión se elige cada punto, y con ella el panel que se dibuja. Es
ortogonal a `mode`: `mode` dice cuántos puntos se eligen, `granularity` con qué precisión cada uno.

```html
<!-- una ventana de validez: cada extremo lleva su propia hora -->
<hub-datepicker formControlName="window" mode="range" granularity="minute" [minuteStep]="15" />

<!-- las unidades gruesas usan una rejilla de 12 celdas en lugar del calendario -->
<hub-datepicker formControlName="billingPeriod" granularity="month" />
```

| `granularity`                | Panel                       | Valor (`valueFormat` por defecto) |
| ---------------------------- | --------------------------- | --------------------------------- |
| `year`                       | Rejilla de década           | `"2026"`                          |
| `month`                      | Rejilla de 12 meses         | `"2026-09"`                       |
| `day` _(por defecto)_        | Calendario                  | `"2026-09-01"`                    |
| `hour` / `minute` / `second` | Calendario + franja de hora | `"2026-09-01T09:30:00+02:00"`     |

#### Ancho del panel y nombre del mes

El panel mide exactamente lo que la rejilla de días que enmarca — siete celdas, los seis huecos
entre ellas y su propio relleno —, así que pasar meses no lo redimensiona. Su cabecera se queda
con lo que dejan los dos grupos de navegación, unos **102px**, y por eso el mes sale **abreviado
por defecto**.

```html
<!-- el mes completo; solo donde se haya ensanchado el panel para que quepa -->
<hub-datepicker formControlName="date" [monthFormat]="'long'" />
```

Pedido al ancho por defecto, `long` se recorta con puntos suspensivos: «septiembre de 2026»
necesita unos 152px frente a los 102 disponibles. Ensancha primero el panel — los dos tokens
alimentan la misma aritmética, y los dos hay que declararlos **globalmente**: el calendario se
dibuja en un overlay colgado de `document.body`, fuera del subárbol del campo, así que una
variable puesta en el componente nunca le llega.

```css
:root {
	--hub-daterangepicker-cell-size: 2.5rem; /* siete de estas */
	--hub-datepicker-grid-gap: 0.25rem; /* seis de estos */
}
```

**La zona horaria del valor.** En `day` y en las unidades más gruesas es una fecha de calendario
sin zona asociada, exactamente como antes. A partir de `hour` es una marca de tiempo ISO 8601
completa que lleva **la hora local del lector y el desfase de esa misma fecha**: `+02:00` en Madrid
en septiembre, `+01:00` para la misma hora en enero. Denota un instante inequívoco; si se necesita
UTC, se convierte con `new Date(value).toISOString()`.

`min` y `max` respetan también la hora: un día sólo se deshabilita cuando ningún instante suyo está
permitido, así que `min="2026-09-01T14:00"` deja el 1 de septiembre pulsable y son los controles de
hora los que rechazan las horas anteriores.

Tres ejes independientes gobiernan los formatos:

```html
<!-- qué guarda el control: 'iso' (por defecto) | 'date' | 'timestamp' | (date) => unknown -->
<hub-datepicker formControlName="due" valueFormat="date" />

<!-- qué lee el usuario: opciones de Intl | un patrón de Angular | (date) => string -->
<hub-datepicker formControlName="due" displayFormat="dd/MM/yyyy HH:mm" />

<!-- cómo se lee un valor entrante; se aplica también a min/max -->
<hub-datepicker formControlName="due" [parse]="parseLegacyDate" />
```

Los strings ISO de cualquier anchura, las instancias de `Date` y los milisegundos de época se
detectan automáticamente, así que `parse` sólo hace falta para dialectos fuera de ese conjunto.

### Timepicker

Una hora del día, como `HH:MM`. Construido sobre el `<input type="time">` de la plataforma,
así que trae el teclado numérico en el móvil, el stepper y la presentación en 12 o 24 horas
del propio lector — mientras que lo que guarda el control se normaliza a `HH:MM` y no cambia
con el idioma.

```html
<hub-timepicker formControlName="opensAt" label="Abre a las" />
<hub-timepicker formControlName="closesAt" [step]="900" min="08:00" max="22:00" />
```

| Input  | Tipo                   | Por defecto | Qué hace                                                                                                                                      |
| ------ | ---------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `min`  | `string` (`HH:MM`)     | `''`        | Hora más temprana que acepta el campo.                                                                                                        |
| `max`  | `string` (`HH:MM`)     | `''`        | Hora más tardía que acepta el campo.                                                                                                          |
| `step` | `number` (en segundos) | `0`         | Granularidad. `900` ofrece cuartos de hora; por debajo de `60` el control muestra segundos, precisión que un horario de apertura nunca tiene. |

Un campo vacío publica `null`, no `''`: «sin hora» es una ausencia, y una cadena de longitud
cero se cuela por un `required` escrito como comprobación de nulo. `label`, `labelType`,
`readonly`, `prepend` / `append` y los proyectados `hubPrepend` / `hubAppend` se comportan como
en cualquier otro campo.

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

`accept`, `maxSize`, `maxFiles` y compañía **filtran**: un fichero que incumple no llega nunca al valor y aparece en `(rejected)` con un motivo tipado. Se aplican a mano, porque el atributo `accept` nativo solo filtra el diálogo del sistema operativo — soltar o pegar lo esquiva. Para que además el _control_ quede inválido (conviene cuando el valor también puede llegar por `patchValue`), añade los validadores correspondientes:

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

```html
<hub-file-input formControlName="attachments" [multiple]="true">
	<ng-template hubFileIcon let-item>
		<hub-icon [name]="item.file.type === 'application/pdf' ? 'fa:solid:file-pdf' : 'fa:solid:file'" />
	</ng-template>
</hub-file-input>
```

#### Reproducir tu propio dropzone

El dropzone se compone de un glifo, una invitación y una acción de examinar, cada uno tematizable por separado — así un design system reproduce el suyo sin bifurcar la plantilla.

- **Medallón del icono** — `--hub-file-input-icon-bg`, `-icon-chip-size` y `-icon-chip-radius` colocan el glifo sobre una superficie teñida y redondeada. Transparente y cuadrada por defecto.
- **Examinar como botón** — `--hub-file-input-browse-bg`, `-hover-bg`, `-padding-x`, `-padding-y`, `-radius` y un glifo delantero opcional (`-browse-icon`, `-browse-icon-display`, `-browse-icon-size`). Por defecto, un enlace subrayado y transparente.
- **Dos líneas de invitación** — `[dropText]` y `[dropSubtext]` (o los textos `dropHere` / `dropSubtext`), apiladas con `--hub-file-input-prompt-direction: column`. La segunda línea está vacía por defecto.
- **Un aviso delante** — `hubFileDropzoneNotice` proyecta marcado dentro del dropzone, entre el glifo y la invitación, para lo que la invitación no puede decir.

```html
<hub-file-input dropText="Suelta aquí tus documentos" dropSubtext="o haz clic para examinar" buttonLabel="Seleccionar ficheros">
	<ng-template hubFileDropzoneNotice>
		<strong class="missing">Faltan {{ missingCount }} documentos</strong>
	</ng-template>
</hub-file-input>
```

### Errores automáticos en todos los niveles

```html
<form [formGroup]="form" hubForm (submit)="save()">
	<fieldset hubFieldset legend="Credentials">
		<hub-input formControlName="email" type="email" label="Email" required />
		<hub-input formControlName="confirm" type="email" label="Confirm email" required />
	</fieldset>
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

#### Dos maneras de escribir el fieldset

`hubFieldset` es un atributo sobre el elemento nativo, así que el grupo cuesta un elemento en
vez de dos: el `<fieldset hubFieldset>` que escribes **es** el fieldset que ve el navegador. La
forma de elemento `<hub-fieldset>` se mantiene y acepta los mismos inputs, pero tiene que
renderizar un `<fieldset>` propio dentro del anfitrión. Usa preferentemente el atributo — es el
marcado que habría escrito un formulario HTML sin librería.

```html
<!-- recomendado: el anfitrión es el fieldset -->
<fieldset hubFieldset legend="Credentials" [group]="form.controls.credentials">…</fieldset>

<!-- equivalente, un elemento más adentro -->
<hub-fieldset legend="Credentials" [group]="form.controls.credentials">…</hub-fieldset>
```

El atributo está restringido a `<fieldset>` a propósito: sobre un `<div>` dibujaría una leyenda
sobre un grupo sin ninguna de las semánticas que las tecnologías de apoyo leen de un fieldset
de verdad.

### Estados de validación (el inválido es automático, el válido es opt-in)

El estado **inválido** siempre es automático: un campo tocado e inválido muestra
su estilo de error y su mensaje sin configuración. El estado **válido / de éxito**
es estrictamente **opt-in** — el éxito _nunca_ se muestra automáticamente. Actívalo
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
@use 'ng-hub-ui-forms/styles' as hub-forms;
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

**`hub-datepicker` dentro de un modal** — la misma garantía, con `--hub-datepicker-overlay-zindex` (por defecto `calc(var(--hub-sys-zindex-modal, 1055) + 5)`): un calendario abierto dentro de un `HubModal` se dibuja por encima del diálogo, y su backdrop una capa por debajo del calendario pero aún por encima del diálogo, así que el clic fuera lo cierra. Un solo token mueve los dos:

```css
:root {
	--hub-datepicker-overlay-zindex: 2000;
}
```

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
`@angular/forms/signals`, de modo que el núcleo sigue siendo compatible con Angular 21. Recomendado en Angular ≥ 22.

```ts
import { HubSignalFieldControl, hubSignalErrorMessages } from 'ng-hub-ui-forms/signals';
```

---

## ♿ Accesibilidad

- Las etiquetas se asocian con su control (`for`/`id`); los campos requeridos se marcan.
- `required` — declarado inline o derivado de `Validators.required`, con `formControlName` **o** con binding directo `[formControl]` — se refleja como `aria-required` en todos los campos, incluidos el input de búsqueda del combobox del select, el `radiogroup` del segmented y cada celda del OTP. Con un binding reactivo mandan los validadores del control: un `required` inline queda sobrescrito por ellos, así que decláralo en los validadores. Los bindings template-driven (`ngModel`) siguen respetando el input inline.
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
