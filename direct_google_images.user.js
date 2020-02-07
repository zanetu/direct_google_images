// ==UserScript==
// @name         Direct Google Images
// @namespace    http://greasyfork.org/en/users/461
// @version      0.14
// @description  Provides direct links in Google Images.
// @include      /^https?\:\/\/(www|encrypted)\.google\./
// @author       zanetu
// @license      GPL version 2 or any later version; http://www.gnu.org/licenses/gpl-2.0.txt
// @grant        GM_addStyle
// @run-at       document-start
// @noframes
// ==/UserScript==

//do not run in frames or iframes
if(window.top == window.self) {
	var RE = /imgres\?imgurl\=(http.+?)\&imgrefurl\=(http.+?)(\&|$)/i
	var RE_SOURCE = /url\?(?:.*?\&)*?url\=(http.+?)(\&|$)/i
	var WATCH_EVENTS = ['mouseenter', 'mousedown', 'click', 'focus', 'touchstart']

	function dd(url) {
		var d1 = decodeURIComponent(url), d2
		try {
			d2 = decodeURIComponent(d1)
		}
		catch(malformed) {
			return d1
		}
		return d2
	}

	function closest(element, matchFunction, maxLevel) {
		var max = undefined === maxLevel ? Number.POSITIVE_INFINITY : parseInt(maxLevel) + 1
		if(max > 0 && 'function' === typeof matchFunction) {
			for(; element && max--; element = element.parentNode) {
				if(matchFunction(element)) {
					return element
				}
			}
		}
		return null
	}

	function modifyGoogleImage(element) {
		if(element && element.href) {
			var m = element.href.match(RE)
			if(m && m[1] && m[2]) {
				element.href = dd(m[1])
				setDirect(element)
				return true
			}
			m = element.href.match(RE_SOURCE)
			if(m && m[1]) {
				element.href = dd(m[1])
				setDirect(element)
				return true
			}
		}
		return false
	}

	function isDirect(e) {
		return 'yes' === (e && e.getAttribute && e.getAttribute('direct'))
	}

	function setDirect(e) {
		e && e.setAttribute && e.setAttribute('direct', 'yes')
	}

	function triggerMouseEvent(element, eventType) {
		var event = new MouseEvent('mousedown', {
			bubbles: true,
			cancelable: true
		})
		element.dispatchEvent(event)
	}

	//override event handlers
	for(var i in WATCH_EVENTS) {
		document.addEventListener(WATCH_EVENTS[i], function(event) {
			var t = event.target
			var aContainer = closest(t, function(e) {
				return 'A' === e.nodeName
				&& (
						//image; regex can be replaced by more recent classList.contains()
						/(^|\s)islib(\s|$)/.test(e.className)
						//image source
						|| 'noopener' === e.getAttribute('rel')
					)
			}, 2)
			if(!aContainer) return
			if(isDirect(aContainer)) {
				if('mouseenter' !== event.type) event.stopPropagation()
				return
			}
			if('mouseenter' === event.type) {
				if(!modifyGoogleImage(aContainer)) {
					var observer = new MutationObserver(function(mutationRecords) {
						for(var j in mutationRecords) {
							modifyGoogleImage(mutationRecords[j].target)
						}
					})
					observer.observe(aContainer, {attributes: true})
					triggerMouseEvent(t, 'mousedown')
				}
			}
		}, true)
	}
}
