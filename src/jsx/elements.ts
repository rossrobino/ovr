// cspell: disable
import type { JSX, ElementProps } from "./index.js";

// https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes
type Attributes<T extends ElementProps = ElementProps> = Partial<{
	children: JSX.Element;
	accesskey: string;
	anchor: string;
	autocapitalize: "on" | "off" | "characters" | "words" | "sentences";
	autocorrect: "on" | "off";
	autofocus: boolean;
	class: string;
	className: string;
	contenteditable: string;
	dir: string;
	draggable: boolean;
	enterkeyhint: string;
	exportparts: string;
	hidden: boolean;
	id: string;
	inert: boolean;
	inputmode: string;
	is: string;
	itemid: string;
	itemprop: string;
	itemref: string;
	itemscope: boolean;
	itemtype: string;
	lang: string;
	nonce: string;
	part: string;
	popover: string;
	// https://www.w3.org/TR/wai-aria-1.1/#role_definitions
	role:
		| "alert"
		| "alertdialog"
		| "application"
		| "article"
		| "banner"
		| "button"
		| "cell"
		| "checkbox"
		| "columnheader"
		| "combobox"
		| "complementary"
		| "contentinfo"
		| "definition"
		| "dialog"
		| "directory"
		| "document"
		| "feed"
		| "figure"
		| "form"
		| "grid"
		| "gridcell"
		| "group"
		| "heading"
		| "img"
		| "link"
		| "list"
		| "listbox"
		| "listitem"
		| "log"
		| "main"
		| "marquee"
		| "math"
		| "menu"
		| "menubar"
		| "menuitem"
		| "menuitemcheckbox"
		| "menuitemradio"
		| "navigation"
		| "none"
		| "note"
		| "option"
		| "presentation"
		| "progressbar"
		| "radio"
		| "radiogroup"
		| "region"
		| "row"
		| "rowgroup"
		| "rowheader"
		| "scrollbar"
		| "search"
		| "searchbox"
		| "separator"
		| "slider"
		| "spinbutton"
		| "status"
		| "switch"
		| "tab"
		| "table"
		| "tablist"
		| "tabpanel"
		| "term"
		| "textbox"
		| "timer"
		| "toolbar"
		| "tooltip"
		| "tree"
		| "treegrid"
		| "treeitem";
	slot: string;
	spellcheck: "true" | "false";
	style: string;
	tabindex: number;
	title: string;
	translate: string;
	virtualkeyboardpolicy: string;
	writingsuggestions: boolean;
	"aria-atomic": "true" | "false";
	"aria-busy": "true" | "false";
	"aria-controls": string;
	"aria-current":
		| "page"
		| "step"
		| "location"
		| "date"
		| "time"
		| "true"
		| "false";
	"aria-describedby": string;
	"aria-description": string;
	"aria-details": string;
	"aria-disabled": "true" | "false";
	"aria-dropeffect": "none" | "copy" | "execute" | "link" | "move" | "popup";
	"aria-errormessage": string;
	"aria-flowto": string;
	"aria-grabbed": "true" | "false";
	"aria-haspopup":
		| "menu"
		| "listbox"
		| "tree"
		| "grid"
		| "dialog"
		| "true"
		| "false";
	"aria-hidden": "true" | "false";
	"aria-invalid": "grammar" | "false" | "spelling" | "true";
	"aria-keyshortcuts": string;
	"aria-label": string;
	"aria-labelledby": string;
	"aria-live": "assertive" | "off" | "polite";
	"aria-owns": string;
	"aria-relevant": "additions" | "all" | "removals" | "text" | "additions text";
	"aria-roledescription": string;
}> &
	ElementProps &
	Partial<T>;

type VoidAttributes<T extends ElementProps = ElementProps> = Omit<
	Attributes<T>,
	"children"
>;

// have lots of values and shared by some elements but not global
type SharedAttributes = {
	autocomplete:
		| "on"
		| "off"
		// https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete#token-list
		| (string & {});
	blocking: "render";
	crossorigin: "anonymous" | "use-credentials";
	referrerpolicy:
		| "no-referrer"
		| "no-referrer-when-downgrade"
		| "origin"
		| "origin-when-cross-origin"
		| "same-origin"
		| "strict-origin"
		| "strict-origin-when-cross-origin"
		| "unsafe-url";
	target: "_self" | "_blank" | "_parent" | "_top";
	preload: "none" | "metadata" | "auto";
	controlslist:
		| "nodownload"
		| "nofullscreen"
		| "noremoteplayback"
		// allows multiple
		| (string & {});
	enctype:
		| "application/x-www-form-urlencoded"
		| "multipart/form-data"
		| "text/plain";
	method: "get" | "post" | "dialog";
	loading: "eager" | "lazy";
	fetchpriority: "high" | "low" | "auto";
	popovertargetaction: "hide" | "show" | "toggle";
};

type AAttributes = Attributes<{
	download: string | boolean;
	href: string;
	hreflang: string;
	ping: string;
	referrerpolicy: SharedAttributes["referrerpolicy"];
	rel:
		| "alternate"
		| "author"
		| "bookmark"
		| "external"
		| "help"
		| "license"
		| "me"
		| "next"
		| "nofollow"
		| "noopener"
		| "noreferrer"
		| "opener"
		| "prev"
		| "privacy-policy"
		| "search"
		| "tag"
		| "terms-of-service"
		// allows multiple
		| (string & {});
	target: SharedAttributes["target"];
	type: string;
}>;

type AreaAttributes = VoidAttributes<{
	alt: string;
	coords: "rect" | "circle" | "poly";
	download: string | boolean;
	href: string;
	ping: string;
	referrerpolicy: SharedAttributes["referrerpolicy"];
	rel: AAttributes["rel"];
	shape: "rect" | "circle" | "poly" | "default";
	target: SharedAttributes["target"];
}>;

type AudioAttributes = Attributes<{
	autoplay: boolean;
	controls: boolean;
	controlslist: SharedAttributes["controlslist"];
	crossorigin: SharedAttributes["crossorigin"];
	disableremoteplayback: boolean;
	loop: boolean;
	muted: boolean;
	preload: SharedAttributes["preload"];
	src: string;
}>;

type BaseAttributes = VoidAttributes<{
	href: string;
	target: SharedAttributes["target"];
}>;

type BlockquoteAttributes = Attributes<{
	cite: string;
}>;

type BodyAttributes = Attributes<{
	onafterprint: string;
	onbeforeprint: string;
	onbeforeunload: string;
	onblur: string;
	onerror: string;
	onfocus: string;
	onhashchange: string;
	onlanguagechange: string;
	onload: string;
	onmessage: string;
	onmessageerror: string;
	onoffline: string;
	ononline: string;
	onpageswap: string;
	onpagehide: string;
	onpagereveal: string;
	onpageshow: string;
	onpopstate: string;
	onresize: string;
	onrejectionhandled: string;
	onstorage: string;
	onunhandledrejection: string;
	onunload: string;
}>;

type ButtonAttributes = Attributes<{
	command: string;
	commandfor: string;
	disabled: boolean;
	form: string;
	formaction: string;
	formenctype: SharedAttributes["enctype"];
	formmethod: SharedAttributes["method"];
	formnovalidate: boolean;
	formtarget: SharedAttributes["target"];
	name: string;
	popovertarget: string;
	popovertargetaction: SharedAttributes["popovertargetaction"];
	type: "button" | "submit" | "reset";
	value: string;
}>;

type CanvasAttributes = Attributes<{
	height: string;
	["moz-opaque"]: boolean;
	width: string;
}>;

type ColAttributes = VoidAttributes<{
	span: string;
}>;

type ColgroupAttributes = Attributes<{
	span: string;
}>;

type DataAttributes = Attributes<{
	value: string;
}>;

type DelAttributes = Attributes<{
	cite: string;
	datetime: string;
}>;

type DetailsAttributes = Attributes<{
	open: boolean;
	name: string;
}>;

type DialogAttributes = Attributes<{
	open: boolean;
}>;

type EmbedAttributes = VoidAttributes<{
	height: string;
	src: string;
	type: string;
	width: string;
}>;

type FieldsetAttributes = Attributes<{
	disabled: boolean;
	form: string;
	name: string;
}>;

type FormAttributes = Attributes<{
	["accept-charset"]: string;
	autocomplete: SharedAttributes["autocomplete"];
	name: string;
	rel:
		| "external"
		| "help"
		| "license"
		| "next"
		| "nofollow"
		| "noopener"
		| "noreferrer"
		| "opener"
		| "prev"
		| "search";
	action: string;
	enctype: SharedAttributes["enctype"];
	method: SharedAttributes["method"];
	novalidate: boolean;
	target: SharedAttributes["target"];
}>;

type HtmlAttributes = Attributes<{
	xmlns: string;
}>;

type IframeAttributes = Attributes<{
	allow: string;
	allowfullscreen: boolean;
	height: string;
	loading: SharedAttributes["loading"];
	name: string;
	referrerpolicy: SharedAttributes["referrerpolicy"];
	sandbox: string;
	src: string;
	srcdoc: string;
	width: string;
}>;

type ImgAttributes = VoidAttributes<{
	alt: string;
	crossorigin: SharedAttributes["crossorigin"];
	decoding: "sync" | "async" | "auto";
	elementtiming: string;
	fetchpriority: SharedAttributes["fetchpriority"];
	height: string;
	ismap: boolean;
	loading: SharedAttributes["loading"];
	referrerpolicy: SharedAttributes["referrerpolicy"];
	sizes: string;
	src: string;
	srcset: string;
	width: string;
	usemap: string;
}>;

type InputAttributes = VoidAttributes<{
	accept: string;
	alt: string;
	autocomplete: SharedAttributes["autocomplete"];
	capture: string;
	checked: boolean;
	dirname: string;
	disabled: boolean;
	form: string;
	formaction: string;
	formenctype: SharedAttributes["enctype"];
	formmethod: SharedAttributes["method"];
	formnovalidate: boolean;
	formtarget: SharedAttributes["target"];
	height: string;
	list: string;
	max: string;
	maxlength: string;
	min: string;
	minlength: string;
	multiple: boolean;
	name: string;
	pattern: string;
	placeholder: string;
	popovertarget: string;
	popovertargetaction: SharedAttributes["popovertargetaction"];
	readonly: boolean;
	required: boolean;
	size: string;
	src: string;
	step: string;
	type:
		| "button"
		| "checkbox"
		| "color"
		| "date"
		| "datetime-local"
		| "email"
		| "file"
		| "hidden"
		| "image"
		| "month"
		| "number"
		| "password"
		| "radio"
		| "range"
		| "reset"
		| "search"
		| "submit"
		| "tel"
		| "text"
		| "time"
		| "url"
		| "week";
	value: string;
	width: string;
}>;

type InsAttributes = Attributes<{
	cite: string;
	datetime: string;
}>;

type LabelAttributes = Attributes<{
	for: string;
	htmlFor: string;
}>;

type LiAttributes = Attributes<{
	value: string;
}>;

type LinkAttributes = VoidAttributes<{
	as:
		| "audio"
		| "document"
		| "embed"
		| "fetch"
		| "font"
		| "image"
		| "object"
		| "script"
		| "style"
		| "track"
		| "video"
		| "worker";
	blocking: SharedAttributes["blocking"];
	crossorigin: SharedAttributes["crossorigin"];
	disabled: boolean;
	fetchpriority: SharedAttributes["fetchpriority"];
	href: string;
	hreflang: string;
	imagesizes: string;
	imagesrcset: string;
	integrity: string;
	media: string;
	// not all the same options as others
	referrerpolicy:
		| "no-referrer"
		| "no-referrer-when-downgrade"
		| "origin"
		| "origin-when-cross-origin"
		| "unsafe-url";
	// not all the same options as others
	rel:
		| "alternate"
		| "author"
		| "canonical"
		| "dns-prefetch"
		| "expect"
		| "help"
		| "icon"
		| "license"
		| "manifest"
		| "me"
		| "modulepreload"
		| "next"
		| "pingback"
		| "preconnect"
		| "prefetch"
		| "preload"
		| "prerender"
		| "prev"
		| "privacy-policy"
		| "search"
		| "stylesheet"
		| "terms-of-service"
		// allows multiple
		| (string & {});
	sizes: string;
	type: string;
}>;

type MapAttributes = Attributes<{
	name: string;
}>;

type MetaAttributes = VoidAttributes<{
	charset: "utf-8";
	content: string;
	"http-equiv":
		| "content-security-policy"
		| "content-type"
		| "default-style"
		| "x-ua-compatible"
		| "refresh";
	media: string;
	name:
		| "application-name"
		| "author"
		| "description"
		| "generator"
		| "keywords"
		| "theme-color"
		| "viewport"
		// allow non-standard meta names
		| (string & {});
}>;

type MeterAttributes = Attributes<{
	value: string;
	min: string;
	max: string;
	low: string;
	high: string;
	optimum: string;
	form: string;
}>;

type ObjectAttributes = Attributes<{
	data: string;
	form: string;
	height: string;
	name: string;
	type: string;
	width: string;
}>;

type OlAttributes = Attributes<{
	reversed: boolean;
	start: string;
	type: "a" | "A" | "i" | "I" | "1";
}>;

type OptgroupAttributes = Attributes<{
	disabled: boolean;
	label: string;
}>;

type OptionAttributes = Attributes<{
	disabled: boolean;
	label: string;
	selected: boolean;
	value: string;
}>;

type OutputAttributes = Attributes<{
	for: string;
	htmlFor: string;
	form: string;
	name: string;
}>;

type ProgressAttributes = Attributes<{
	max: string;
	value: string;
}>;

type QAttributes = Attributes<{
	cite: string;
}>;

type ScriptAttributes = Attributes<{
	async: boolean;
	blocking: SharedAttributes["blocking"];
	crossorigin: SharedAttributes["crossorigin"];
	defer: boolean;
	fetchpriority: SharedAttributes["fetchpriority"];
	integrity: string;
	nomodule: boolean;
	referrerpolicy: SharedAttributes["referrerpolicy"];
	src: string;
	type: "module" | "importmap" | "speculationrules";
}>;

type SelectAttributes = Attributes<{
	autocomplete: SharedAttributes["autocomplete"];
	disabled: boolean;
	form: string;
	multiple: boolean;
	name: string;
	required: boolean;
	size: string;
}>;

type SlotAttributes = Attributes<{
	name: string;
}>;

type SourceAttributes = VoidAttributes<{
	type: string;
	src: string;
	srcset: string;
	sizes: string;
	media: string;
	height: string;
	width: string;
}>;

type StyleAttributes = Attributes<{
	blocking: SharedAttributes["blocking"];
	media: string;
}>;

type TdAttributes = Attributes<{
	colspan: string;
	headers: string;
	rowspan: string;
}>;

type TemplateAttributes = Attributes<{
	shadowrootmode: "open" | "closed";
	shadowrootclonable: boolean;
	shadowrootdelegatesfocus: boolean;
	shadowrootserializable: boolean;
}>;

type TextareaAttributes = Attributes<{
	autocomplete: SharedAttributes["autocomplete"];
	cols: string;
	dirname: string;
	disabled: boolean;
	form: string;
	maxlength: string;
	minlength: string;
	name: string;
	placeholder: string;
	readonly: boolean;
	required: boolean;
	rows: string;
	wrap: "hard" | "soft" | "off";
}>;

type ThAttributes = Attributes<{
	abbr: string;
	colspan: string;
	headers: string;
	rowspan: string;
	scope: "row" | "col" | "rowgroup" | "colgroup" | (string & {});
}>;

type TimeAttributes = Attributes<{
	datetime: string;
}>;

type TrackAttributes = VoidAttributes<{
	default: boolean;
	kind: "subtitles" | "captions" | "chapters" | "metadata";
	label: string;
	src: string;
	srclang: string;
}>;

type VideoAttributes = Attributes<{
	autoplay: boolean;
	controls: boolean;
	controlslist: SharedAttributes["controlslist"];
	crossorigin: SharedAttributes["crossorigin"];
	disablepictureinpicture: boolean;
	disableremoteplayback: boolean;
	height: string;
	loop: boolean;
	muted: boolean;
	playsinline: boolean;
	poster: string;
	preload: SharedAttributes["preload"];
	src: string;
	width: string;
}>;

export type Elements = Record<string, Attributes> & {
	a: AAttributes;
	abbr: Attributes;
	address: Attributes;
	area: AreaAttributes;
	article: Attributes;
	aside: Attributes;
	audio: AudioAttributes;
	base: BaseAttributes;
	bdi: Attributes;
	bdo: Attributes;
	blockquote: BlockquoteAttributes;
	body: BodyAttributes;
	br: VoidAttributes;
	button: ButtonAttributes;
	canvas: CanvasAttributes;
	caption: Attributes;
	cite: Attributes;
	code: Attributes;
	col: ColAttributes;
	colgroup: ColgroupAttributes;
	data: DataAttributes;
	datalist: Attributes;
	dd: Attributes;
	del: DelAttributes;
	details: DetailsAttributes;
	dfn: Attributes;
	dialog: DialogAttributes;
	div: Attributes;
	dl: Attributes;
	dt: Attributes;
	em: Attributes;
	embed: EmbedAttributes;
	fieldset: FieldsetAttributes;
	figcaption: Attributes;
	figure: Attributes;
	footer: Attributes;
	form: FormAttributes;
	h1: Attributes;
	h2: Attributes;
	h3: Attributes;
	h4: Attributes;
	h5: Attributes;
	h6: Attributes;
	head: Attributes;
	header: Attributes;
	hgroup: Attributes;
	hr: VoidAttributes;
	html: HtmlAttributes;
	iframe: IframeAttributes;
	i: Attributes;
	img: ImgAttributes;
	input: InputAttributes;
	ins: InsAttributes;
	kbd: Attributes;
	label: LabelAttributes;
	legend: Attributes;
	li: LiAttributes;
	link: LinkAttributes;
	main: Attributes;
	map: MapAttributes;
	mark: Attributes;
	menu: Attributes;
	meta: MetaAttributes;
	meter: MeterAttributes;
	nav: Attributes;
	noscript: Attributes;
	object: ObjectAttributes;
	ol: OlAttributes;
	optgroup: OptgroupAttributes;
	option: OptionAttributes;
	output: OutputAttributes;
	p: Attributes;
	picture: Attributes;
	pre: Attributes;
	progress: ProgressAttributes;
	q: QAttributes;
	rp: Attributes;
	rt: Attributes;
	ruby: Attributes;
	s: Attributes;
	samp: Attributes;
	script: ScriptAttributes;
	search: Attributes;
	section: Attributes;
	select: SelectAttributes;
	slot: SlotAttributes;
	small: Attributes;
	source: SourceAttributes;
	span: Attributes;
	strong: Attributes;
	style: StyleAttributes;
	sub: Attributes;
	summary: Attributes;
	sup: Attributes;
	table: Attributes;
	tbody: Attributes;
	td: TdAttributes;
	template: TemplateAttributes;
	textarea: TextareaAttributes;
	tfoot: Attributes;
	th: ThAttributes;
	thead: Attributes;
	time: TimeAttributes;
	title: Attributes;
	tr: Attributes;
	track: TrackAttributes;
	u: Attributes;
	ul: Attributes;
	var: Attributes;
	video: VideoAttributes;
	wbr: VoidAttributes;
};
