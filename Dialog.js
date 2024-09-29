import { lib, game, ui, get, ai, _status } from "../../noname.js";

class Dialog {
	constructor(parentNode) {
		const oldDialog = _status.event.dialog || ui.dialog;
		const dialog = ui.create.dialog();
		const oriPrototype = Object.getPrototypeOf(dialog);
		Object.setPrototypeOf(dialog, Dialog.prototype);
		Object.setPrototypeOf(Dialog.prototype, oriPrototype);
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

export default Dialog;
