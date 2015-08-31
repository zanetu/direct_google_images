// ==UserScript==
// @name         Direct Google Images
// @namespace    http://greasyfork.org/en/users/461
// @version      0.7
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
		return decodeURIComponent(decodeURIComponent(url))
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
	
	function modifyGoogleImages() {
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
				var barA = document.createElement('a')
				barA.href = dd(m[2])
				var barSpans = element.getElementsByClassName('rg_ilmn')
				if(barSpans && barSpans[0]) {
					barSpans[0].style.textDecoration = 'underline'
					barSpans[0].parentNode.parentNode.appendChild(barA)
					barA.appendChild(barSpans[0].parentNode)
				}
			}
			//imagebox_bigimages
			else if('bia uh_rl' == element.className) {
				var linkContainer = element.parentNode && element.parentNode.nextSibling
				if(linkContainer && 'rg_meta' == linkContainer.className) {
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
			var observer = new MutationObserver(function(mutations) {
				modifyGoogleImages()
			})
			//tiny delay needed for firefox
			setTimeout(function() {
				var main = document.getElementById('main')
				!main || observer.observe(main, {childList: true, subtree: true})
				modifyGoogleImages()
			}, 100)
		}
		//for chrome v18-, firefox v14-, internet explorer v11-, opera v15- and safari v6-
		else {
			setInterval(function() {
				modifyGoogleImages()
			}, 500)
		}
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
