// ==UserScript==
// @name         Direct Google Images
// @namespace    http://greasyfork.org/en/users/461
// @version      0.12
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
	var RE_IMAGEBOX = /\"ou\"\:\"(http.+?)\"/
	var BLOCKED_EVENTS = ['mousedown', 'click']
	
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
	
	function handleChange() {
		var a = document.getElementsByTagName('a')
		for(var i = a.length - 1; i >= 0; i--) {
			modifyGoogleImage(a[i])
		}
	}
	
	function modifyGoogleImage(element) {
		if(element && element.href) {
			var m = element.href.match(RE)
			if(m && m[1] && m[2]) {
				element.href = dd(m[1])
				var barDiv = element.getElementsByClassName('rg_ilmbg')[0]
				if(barDiv && !barDiv.getElementsByTagName('a').length) {
					var barA = document.createElement('a')
					barA.href = dd(m[2])
					barA.style.color = 'inherit'
					barA.appendChild(barDiv.childNodes[0])
					barDiv.appendChild(barA)
				}
			}
			//imagebox_bigimages
			else if('bia uh_rl' == element.className) {
				var linkContainer = element.parentNode && element.parentNode.nextSibling
				if(linkContainer && 
						(' ' + linkContainer.className + ' ').indexOf(' rg_meta ') > -1
				) {
					m = linkContainer.innerHTML.match(RE_IMAGEBOX)
					if(m && m[1]) {
						element.href = m[1]
					}
				}
			}
		}
	}
	
	function monitor() {
		MutationObserver = window.MutationObserver || window.WebKitMutationObserver
		if(MutationObserver) {
			var observer = new MutationObserver(handleChange)
			observer.observe(document.documentElement, {childList: true, subtree: true})
		}
		//for chrome v18-, firefox v14-, internet explorer v11-, opera v15- and safari v6-
		else {
			setInterval(handleChange, 500)
		}
		handleChange()
	}
	//in case user clicks too early
	var m = location.href.match(RE)
	if(m && m[1]) {
		location.replace(dd(m[1]))
	}
	//override event handlers
	for(var i = BLOCKED_EVENTS.length - 1; i >= 0; i--) {
		document.addEventListener(BLOCKED_EVENTS[i], function(event) {
			var t = event.target
			var aContainer = closest(t, function(e) {
				return 'A' === e.nodeName
				&& ('rg_l' === e.className || 'bia uh_rl' === e.className)
			}, 4)
			if(aContainer) {
				event.stopPropagation()
				if('click' === event.type) {
					modifyGoogleImage(aContainer)
				}
			}
		}, true)
	}
	//"@run-at document-start" is not fully supported
	if('interactive' == document.readyState || 'complete' == document.readyState) {
		monitor()
	}
	else {
		document.addEventListener('DOMContentLoaded', monitor, false)
	}
}
