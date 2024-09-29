import { lib, game, ui, get, ai, _status } from "../../../noname.js";

export default class Dialog {
	constructor(parentNode) {
		const oldDialog = _status.event.dialog || ui.dialog;
		const dialog = ui.create.dialog();
		Object.setPrototypeOf(Dialog.prototype, Object.getPrototypeOf(dialog));
		Object.setPrototypeOf(dialog, this);
		dialog.classList.remove('nobutton');
		dialog.classList.add('content');
		dialog.classList.add('fixed');
		dialog.style.transform = '';
		dialog.style.opacity = '';
		dialog.style.height = '';
		ui.dialog = oldDialog;
		parentNode.appendChild(dialog);
		dialog.open();
		return dialog;
	}
}

