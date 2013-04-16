/**
 * FBPopup.js
 *
 * Facebook function to create a facebook styled popup dialog.
 * Also includes a private "methods" object with various helper functions for generating the popup.
 *
 * Replaces jQuery.Nodes('fbDialog', {});
 *
 * @author Andreas Kristiansen <ak@nodes.dk>
 * @since 2012.01.17
 */
(function() {

	/**
	 * FBPopup!
	 *
	 * FBPopup will read global configuration of off Nodes.Configuration.FBPopupGlobalConfig - if defined.
	 * These settings will still be overwritten by configration for the specific popup.
	 *
	 * @param userOptions
	 */
	function FBPopup (userOptions) {

		/**
		 * Options object
		 *
		 * General:
		 * @property String pid                   ID of popup in the DOM. If no given a random is generated.
		 * @property String oid                   ID of overlay in the DOM. If no given equals options.pid+'_overlay'.
		 * @property String appendTo              jQuery selector for element the popup is appended to
		 * @property Bool overlay                 Boolean determing determining if an overlay should be shown.
		 * @property Int popupFadeTime            Milliseconds for fadeIn and fadeOut popup
		 * @property Int overlayFadeTime          Milliseconds for fadeIn and fadeOut overlay
		 * @property Int viewSize                 Width of view/document/iframe/etc. - defaults to jQuery(document).width().
		 * @property Object size                  Has two properties; width,height in pixels
		 * @property Object placement             Has two properties; top,left in pixels (If defined both is required)
		 * @property String className             Name of additional CSS class(es) appended to popup. (not overlay).
		 * @property Bool closeable               If TRUE: Clicking overlay and Esc button will both close popup. And a closing X in top right corner.
		 * @property Bool show                    Boolean determing if popup should be shown when initialized.
		 *
		 * Content:
		 * @property String title                 Popup title
		 * @property String body                  Popup main content
		 * @property String subText               Content for subText
		 *
		 * Buttons:
		 * @property String actionButton          String used as value on action button
		 * @property String primaryButton         String used as value on primary button
		 * @property String secondaryButton       String used as value on secondary button
		 *
		 * Callbacks:
		 * @property Function onAction            Callback when action button is clicked
		 * @property Function onPrimary           Callback when primary button is clicked
		 * @property Function onSecondary         Callback when secondary button is clicked
		 * @property Function onBeforeShow        Callback before window is fading in.
		 * @property Function onAfterShow         Callback when popup shows
		 * @property Function onBeforeClose       Callback before removing from DOM. Returning FALSE here will prevent closing/removing.
		 * @property Function onAfterClose        Callback after the popup has been removed from the DOM.
		 */

		var options = {
			//General
			'pid'               : false,
			'oid'               : false,
			'appendTo'          : 'body',
			'overlay'           : true,
			'popupFadeTime'     : 200,
			'overlayFadeTime'   : 200,
			'viewSize'          : jQuery('body').width(),
			'size'              : false,
			'placement'         : false,
			'className'         : '',
			'closeable'         : true,
			'show'              : true,
			//Content
			'title'             : '',
			'body'              : '',
			'subText'           : false,
			//Buttons
			'actionButton'      : false,
			'primaryButton'     : 'Okay',
			'secondaryButton'   : false,
			//Callbacks
			'onAction'          : false,
			'onPrimary'         : false,
			'onSecondary'       : false,
			'onBeforeShow'      : false,
			'onAfterShow'       : false,
			'onBeforeClose'     : false,
			'onAfterClose'      : false
		};

		//If global configuration has been detected, apply it.
		if(Nodes.config('FBPopupGlobalConfig')) {
			options = jQuery.extend(options, Nodes.config('FBPopupGlobalConfig'));
		}

		options = jQuery.extend(options, userOptions);

		//Giving the popup an id if none is given.
		if(!options.pid) {
			options.pid = 'fbpopup_'+(new Date().getTime());
		}
		if(!options.oid) {
			options.oid = options.pid+'_overlay';
		}

		/*
		 * Overlay div.
		 *
		 */
		var overlay = jQuery('<div class="fb-popup-tpl-overlay"></div>');
			overlay.attr('id', options.oid);
			overlay.on('click', function (e) {
				e.preventDefault();
				e.stopPropagation();
			});
			overlay.css({
				width: jQuery(document).outerWidth(),
				height: jQuery(document).outerHeight()
			});

		//Popup popup
		var popup = jQuery(''+
		'		<div class="fb-popup-tpl-container '+options.className+'" id="'+options.pid+'">' +
		'			<div class="fb-popup-tpl-header">' +
		'				<a href="#" class="fb-popup-tpl-close">x</a>' +
		'				<span class="fb-popup-tpl-title">'+options.title+'</span>' +
		'			</div>' +
		'			<div class="fb-popup-tpl-body">' + options.body +
		'				<p class="fb-popup-tpl-subText">'+ options.subText +'</p>' +
		'			</div>' +
		'		<div class="fb-popup-tpl-footer">' +
		'				<div>' +
		'					<p>' +
		'						<a href="#" class="button btn action btn-action"><span>'+options.actionButton+'</span></a>' +
		'						<a href="#" class="button btn btn-success">'+options.primaryButton+'</a>' +
		'						<a href="#" class="button btn btn-secondary">'+options.secondaryButton+'</a>' +
		'					</p>' +
		'				</div>' +
		'			</div>' +
		'		</div>');

		/**
		 * Close method.
		 *
		 * Will close the popup.
		 */
		popup.close = function () {
			methods.closePopup(options, popup);
		}

		/**
		 * Open method.
		 *
		 * Will open the popup.
		 */
		popup.open = function() {
			//Configuring user events
			methods.configureUserEvents(options, popup, overlay);
			//Showing popup
			methods.showPopup(options, popup, overlay);
		}

		//Removing elements that is not set in options object
		methods.removeElements(options, popup);

		if(options.show) {
			popup.open();
		}

		return popup;
	}

	//Making FBPopup globally available.
	window.FBPopup = FBPopup;

	/**
	 *
	 *
	 * Helper methods used to generate popup.
	 *
	 *
	 */
	var methods = {
		/**
		 * Function to show popup
		 *
		 * @param Object options - options object from fbpopup
		 * @param Object popup - popup object from fbpopup
		 * @param Object overlay - overlay object form fbpopup
		 */
		showPopup : function (options, popup, overlay) {
			//Callback
			if(options.onBeforeShow && !options.onBeforeShow(options)) {
				return;
			}

			//Appending popup to overlay
			//overlay.append(popup);
			if(options.overlay) {
				jQuery('body').append(overlay);
			}
			//Appending to DOM
			jQuery(options.appendTo).append(popup);

			//Fit popup size
			methods.fitSize(options, popup);
			//Centering popup
			methods.placePopup(options, popup);

			//Fade in
			if(options.overlay) {
				overlay.animate({opacity:1,filter:''}, options.overlayFadeTime, function () {
					jQuery(this).show();
					popup.animate({opacity:1,filter:''},options.popupFadeTime, function () { jQuery(this).show(); });
				});
			} else {
				popup.animate({opacity:1,filter:''}, options.popupFadeTime, function () { jQuery(this).show(); });
			}

			//Callback
			if(options.onAfterShow) {
				options.onAfterShow(options);
			}
		},

		/**
		 * Function to close popup
		 *
		 * @param Object options - options object from fbpopup
		 * @param Object popup - popup object from fbpopup
		 */
		closePopup : function (options, popup) {
			//Callback
			if(options.onBeforeClose && !options.onBeforeClose(options)) {
				return;
			}

			//CLOSING
			if(options.overlay) {
				popup.fadeOut(options.popupFadeTime, function () {
					jQuery('#'+options.oid).fadeOut(options.overlayFadeTime, function () {
						//Removing popup from DOM
						//jQuery('#'+options.pid).remove();
						popup.remove();
						jQuery(this).remove();
						//Callback
						if(options.onAfterClose) {
							options.onAfterClose(options);
						}
					});
				});
			} else {
				popup.fadeOut(options.popupFadeTime, function () {
					//Removing popup from DOM
					jQuery(this).remove();
					//Callback
					if(options.onAfterClose) {
						options.onAfterClose(options);
					}
				});
			}
		},

		/**
		 * Fit size
		 *
		 * Implementing user specific sizes for popup - if any.
		 *
		 * @param Object options - options object from fbpopup
		 * @param Object popup - popup object from fbpopup
		 *
		 * @todo
		 * 	- Find container padding instead of just subtrachting 20 px from height.
		 */
		fitSize : function (options, popup) {
			if(options.size) {
				if(options.size.width) {
					popup.css('width', options.size.width);
				}

				//Height is defined as height of total popup
				//Actual height should be applied to popup body (subtract padding, header, footer)
				if(options.size.height) {
					var newHeight = options.size.height
						 - (popup.find('.fb-popup-tpl-header').outerHeight()
						 + popup.find('.fb-popup-tpl-footer').outerHeight())-20;

					popup.find('.fb-popup-tpl-body').css({
						'height' : newHeight,
						'overflow' : 'auto'
					});
				}
			}
		},

		/**
		 * Removing elements from popup.
		 *
		 * Elements that is not set in options object should be removed.
		 *
		 * @param Object options - options object from fbpopup
		 * @param Object popup - popup object from fbpopup
		 */
		removeElements : function (options, popup) {
			if(!options.subText) {
				popup.find('.fb-popup-tpl-subText').remove();
			}
			if(!options.actionButton) {
				popup.find('.btn.btn-action').remove();
			}
			if(!options.primaryButton) {
				popup.find('.btn.btn-success').remove();
			}
			if(!options.secondaryButton) {
				popup.find('.btn.btn-secondary').remove();
			}

			//If not closeable insert padlock
			if(!options.closeable) {
				popup.find('.fb-popup-tpl-close').remove();
				popup.find('.fb-popup-tpl-header').addClass('locked');
			}
		},

		/**
		 * Adding eventlisteners to buttons.
		 * Also handeling button callbacks.
		 *
		 * @param Object options - options object from fbpopup
		 * @param Object popup - popup object from fbpopup
		 * @param Object overlay - overlay object form fbpopup - in order to put click event on it.
		 */
		configureUserEvents : function (options, popup, overlay) {
			//Action button
			popup.find('.btn.btn-action').on('click', function (e) {
				e.preventDefault();
				//If callback is defined it needs to return true to close popup
				if(options.onAction && !options.onAction(options)) {
					return false;
				}
				//Close popup
				methods.closePopup(options, popup);
			});

			//Primary button
			popup.find('.btn.btn-success').on('click', function (e) {
				e.preventDefault();
				if(options.onPrimary && !options.onPrimary(options)) {
					return false;
				}
				methods.closePopup(options, popup);
			});
			//Secondary button
			popup.find('.btn.btn-secondary').on('click', function (e) {
				e.preventDefault();
				if(options.onSecondary && !options.onSecondary(options)) {
					return false;
				}
				methods.closePopup(options, popup);
			});

			//Close button
			popup.find('.fb-popup-tpl-close').on('click', function(e) {
				e.preventDefault();
				methods.closePopup(options, popup);
			});

			//If options.closeable is true, clicking the overlay and Esc button will also close popup
			if(options.closeable) {
				overlay.on('click', function (e) {
					if(jQuery(e.target).hasClass('fb-popup-tpl-overlay')) {
						methods.closePopup(options, popup);
					}
				});
				//Esc
				jQuery(document).keyup(function(e) {
					if (e.keyCode == 27) {
						methods.closePopup(options, popup);
					}
				});
			}
		},

		/**
		 * Centering popup
		 *
		 * If options.placement "top" AND "left" is set, place there.
		 * Otherwise the popup will be placed in the center of the screen with help from FB.Canvas.getPageInfo()
		 *
		 * @param Object options - options object from fbpopup
		 * @param Object popup - popup object from fbpopup (jQuery object)
		 */
		placePopup : function (options, popup) {
			/*
			 * If the popups position has been customized, place as so.
			 */
			if(options.placement && (options.placement.top && options.placement.left)) {
				popup.css({
					'top'       : options.placement.top,
					'left'      : options.placement.left,
					'zIndex'    : 9999
				});
			} else if (typeof(FB) != 'undefined' && window.name.match(/^app_runner_fb/)) {
				/*
				 * Placing the popup on the center of the screen.
				 * This is done in the callback of the asynchronously by the FB JS SDK.
				 * Need to get info from the SDK in order to place the popup on the center of the screen.
				 */
				FB.Canvas.getPageInfo(
					function(pageInfo) {
						//New position
						var newTop = ((pageInfo.clientHeight/2) - (popup.outerHeight()/2)) - pageInfo.offsetTop + pageInfo.scrollTop;
						var newLeft = ((options.viewSize-popup.outerWidth())/2);

						//Making sure popup doesn't get out of view
						if ((newTop + popup.outerHeight()) > jQuery(document).height()) {
							newTop = jQuery(document).height() - popup.outerHeight();
						}
						if (newTop < 0) {
							newTop = 0;
						}
						if(newTop < pageInfo.scrollTop) {
							newTop = pageInfo.scrollTop-pageInfo.offsetTop+47;//47 is the facebook topbar(37 plus 10px margin)
						}

						//Applying the CSS to center the popup
						popup.css ({
							'left'   : newLeft,
							'top'    : newTop,
							'zIndex' : 9999
						});

					}
				);
				//End centering
			} else {
				var newTop  = (jQuery(window).height() / 2) - (popup.outerHeight() / 2);
				var newLeft = (jQuery(window).width() / 2)  - (popup.outerWidth() / 2);

				//Applying the CSS to center the popup
				popup.css({
					'left'     : newLeft,
					'top'      : newTop,
					'position' : 'fixed',
					'zIndex'   : 9999
				});
			}
		}
	}
})();
