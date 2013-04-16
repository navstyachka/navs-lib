(function() {
	/**
	 * FBUser object.
	 *
	 * This object is handeling our Facebook user object.
	 * This uses the FB JS SDK, but have a few tweaks that'll make you prefer this ;)
	 *
	 * @author Andreas Kristiansen <ak@nodes.dk>
	 * @since 2012.02.04
	 *
	 * @requires jQuery
	 *	jQuery.extend()
	 *	jQuery.bind()
	 *	jQuery.each()
	 *	jQuery.trim()
	 *	jQuery.inArray()
	 */
	var FBUser = {
		// Boolean checking if FBUser has been intialized and ready for use.
		isInitialized : false,

		// Caching login status
		loginStatus : null,

		// Caching scope/permissions in an array
		scope : [],

		// caching the user localy after login
		userData : null,

		/**
		 * Initializing FBUser.
		 *
		 * IMPORTANT!
		 * Needs to be initialized as the first thing once fbAsyncInit() is invoked!
		 *
		 * Once this function is invoked it will make a call to this.updateLoginStatus,
		 * this is done to help the process of prompting the user for login. If it was
		 * done in the actual clickevent the clickevent could get lost because of the
		 * two nested requests to facebook FB.getLoginStatus and FB.login().
		 *
		 * @return void
		 */
		init : function() {
			// First thing to do is to get and cache the current login status and permissions
			this.updateLoginStatus({
				updateScope : 1
			});
		},

		/**
		 * Requesting the login status from facebook.
		 * (When FBUser is initialized options.updateScope will be set.)
		 *
		 * @param callback options.onComplete - Callback once the request is complete
		 * @param bool options.updateScope - If set scope will also be retrieved
		 */
		updateLoginStatus : function(options) {
			var options = options || { };
			FB.getLoginStatus(function(res) {
				// Setting local cache in FBUser
				FBUser.loginStatus = res.status;
				// Callback when login status is retrieved
				if (options.onComplete) {
					options.onComplete(FBUser.getLoginStatus());
				}

				// If scope is should be updated
				if (options.updateScope && FBUser.isLoggedIn()) {
					FBUser.updateScope();
				// Invoking FBUserAsyncInit
				} else if (!FBUser.isInitialized) {
					FBUser.isInitialized = true;
					jQuery(document).trigger('FBUserAsyncInit');
				}
			});
		},

		/**
		 * Update scope in FBUser
		 *
		 * Will grab all the permissions the user has granted and put them into FBUser.scope[]
		 *
		 * @param Callback options.onComplete- Callback when request is complete
		 * @param object options.callbackData - data send to callback, if null scope will be send
		 */
		updateScope : function(options) {
			options = options || { };
			FB.api('/me/permissions', function(res) {
				// Looping permissions to cache in FBUser
				FBUser.scope = []; // Empty first
				jQuery.each(res.data[0], function(permission, allowed) {
					if (allowed) {
						FBUser.scope.push(permission);
					}
				});

				// Invoking FBUserAsyncInit
				if (!FBUser.isInitialized) {
					FBUser.isInitialized = true;
					jQuery(document).trigger('FBUserAsyncInit');
				}

				// Callback
				if (options.onComplete) {
					if(options.callbackData) {
						options.onComplete(options.callbackData);
					} else {
						options.onComplete(FBUser.getScope());
					}
				}
			});
		},

		/**
		 * Loggin user in.
		 *
		 * This will prompt the user for login if he/she is NOT logged in.
		 * Will also check if additional permissions is requested, and automatically tell PHP to update informations.
		 *
		 * @param string   scope	  Comma seperated string of permissions
		 * @param callback onSuccess  Callback if the user logged in (If additional permissions is requested, this function will be send as "onComplete" callback for FBUser.updateScope()
		 * @param callback onFailure  Callback if user did not log in
		 */
		login : function(options) {
			// Default options
			var options = jQuery.extend({
				scope	  : Nodes.config('Application.default_permissions'),
				onSuccess : function() { },
				onFailure : function() { },
				phpAuth	  : true
			}, options);

			// If we havent recived any loginstatus yet
			if (this.getLoginStatus() === null) {
				throw "FBUser has not been initialized yet! Please check 'Site URL', 'App Domain', 'Website' and 'Sandbox Mode' FB app settings ( https://developers.facebook.com/apps/" + Nodes.config('Application.app_id') + "/ )";
			}

			// If we are logged in, and no additional permissions is requested
			if (this.isLoggedIn() && this.hasPermissions(options.scope) && !options.updateInformations) {
				FBUser.authenticatePHP({
					updateInformations : 0,
					phpAuth : options['phpAuth'],
					onComplete : function(res) {
						options.onSuccess(res);
					}
				});
				return;
			}

			// Prompting for login
			FB.login(function(response) {
				// If login successfull
				if (response.authResponse) {

					// Refreshing local cache of login status
					FBUser.updateLoginStatus({
						onComplete : function() {

							// Telling php to update information
							FBUser.authenticatePHP({
								// If we don't have permissions tell PHP to update information
								updateInformations : (!FBUser.hasPermissions(options.scope) || options.updateInformations),
								phpAuth : options['phpAuth'],
								onComplete : function(res) {
									// If scope should be updated, send the options.onSuccess() as the options.onComplete callback for FBUser.updateScope()
									// This is so the user - in the onSuccess callback - can check if user accepted the additional permissions.
									if (!FBUser.hasPermissions(options.scope)) {
										FBUser.updateScope({
											onComplete : function(scope) {
												// Doublecheck that the desired permissions were actually accepted
												if (FBUser.hasPermissions(options.scope)) {
													options.onSuccess(res);
												} else {
													options.onFailure();
												}
											}
										});
									// Else just invoked the onSuccess callback
									} else {
										// Callback
										options.onSuccess(res);
									}
								}
							});// end authenticatePHP
						}
					});// end updateLoginStatus

				// If user did not login
				} else {
					options.onFailure();
				}
			}, { scope: options.scope });
		},// end login

		/**
		 * Logging out current user
		 *
		 * Will remove all permissions user have granted to application.
		 * If you want to logout the user from facebook use FB.logout();
		 *
		 * @param callback options.onComplete - Callback FB api call is complete
		 */
		logout : function(options) {
			options = jQuery.extend({
				onComplete : function() {}
			}, options);

			// Removing the application authorization to the users data
			FB.api({method: 'Auth.revokeAuthorization'}, function(response){
				options.onComplete(response);
			});
		},

		/**
		 * Telling PHP to update data.
		 *
		 * @param callback options.onComplete - Callback when PHP is done
		 * @param bool updateInformation - Boolean to see if information should be updated (otherwise only session will be refreshed).
		 */
		authenticatePHP : function(options) {
			var _self = this;

			// Default options
			options = jQuery.extend({
				onComplete : function(){},
				phpAuth	  : true
			}, options);

			if (options['phpAuth']) {
				jQuery.ajax({
					url : Nodes.Router.applicationPrefix() + '/backend/facebook_users/authenticate.json',
					type : 'POST',
					dataType : 'JSON',
					data : {
						updateInformations : options.updateInformations,
						facebook_session: FB.getAuthResponse()
					},
					success : function(res) {
						options.onComplete(res);
						_self.userData = res.data;
					},
					error	: function(jqXHR, textStatus, errorThrown) {
						options.onComplete({
							success : false,
							data	: null
						});
					}
				});
			} else {
				options.onComplete({});
			}
		},

		/**
		 * Scope string to array.
		 *
		 * Turns a string like "email, user_birthday" into ["email", "user_birthday"] and returns the array.
		 * This function will also check if argument given is a String, if that is false then scope will be returned without any changes.
		 *
		 * @param mixed scope - Comma seperated String or Array of permissions
		 * @return mixed scope
		 */
		scopeToArray : function(scope) {
			if (typeof scope == 'string') {
				// split() will return an array with length 1 on an empty string.
				if (scope.length>0) {
					var scope = scope.split(/[\s,]+/);
					jQuery.each(scope, function(i, permission) {
						scope[i] = jQuery.trim(scope[i]);
					});
				} else {
					scope = []; // Return array with length 0
				}
			} else if (typeof scope == 'undefined' || scope == null) {
				scope = [];
			}
			return scope;
		},

		/**
		 * Is Logged In.
		 *
		 * Returns true if FBUser currently holds a logged in user
		 *
		 * @return Bool
		 */
		isLoggedIn : function() {
			return this.getLoginStatus()==="connected";
		},

		/**
		 * Getting login status
		 *
		 * @return String - current login status (connected, not_authorized or unknown)
		 */
		getLoginStatus : function() {
			return this.loginStatus;
		},

		/**
		 * Get scope of permissions
		 *
		 * @return Object scope
		 */
		getScope : function() {
			return this.scope;
		},

		/**
		 * Get cached user object, only available after login
		 *
		 * @return Object scope
		 */
		getUser : function() {
			return this.userData;
		},

		/**
		 * Check if user has specific permission(s)
		 *
		 * @param Mixed scope - Array or String with permission(s)
		 */
		hasPermissions : function(scope) {
			// Making sure argument is array
			scope = this.scopeToArray(scope);
			var hasPerm = 1; // If user has permission

			// Looping argument
			jQuery.each(scope, function(i, permission) {
				if (jQuery.inArray(permission, FBUser.getScope()) === -1) {
					hasPerm = 0;
				}
			});
			return hasPerm;
		}
	};

	// Make it official
	window.FBUser = FBUser;

	// Initialzing
	jQuery(document).bind('fbAsyncInit', function() {
		FBUser.init();
	});

// End of FBUser scope
})();
