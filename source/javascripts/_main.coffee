#------------------------------------------------------------------------
# Main
#------------------------------------------------------------------------

app = {}

$ ->
  new app.Popup()
  new app.Scroller()

class app.Popup
  constructor: ->
    @open = $('[data-signup-btn]')
    @close = $('[data-popup-close]')
    @container = $('[data-popup-container]')
    @innerContainer = $('[data-popup-inner]')

    @open.on 'click', (e)=>
      e.preventDefault()
      @container.addClass('showed')

    @close.on 'click', =>
      @container.removeClass('showed')


class app.ScrollEventOptimizer
  constructor: (event=undefined, interval=500)->
    if event?
      @event = event
    else
      @event = (offset)=>
        $(@).trigger(
          type: ScrollEventOptimizer.EVENTS.SCROLL
          offset: offset
        )

    @interval = interval
    @activate()

  # section: handlers
  scrollHandler: => @isScrolled=true

  intervalHandler: =>
    if @isScrolled
      @event($(document).scrollTop())
      @isScrolled=false

  # section: Disactivation & activation
  deactivate: =>
    @isScrolled=false
    $(window).unbind("scroll", @scrollHandler)
    window.clearInterval(@intervalId)

  activate: =>
    @isScrolled=false
    $(window).bind("scroll", @scrollHandler)
    @intervalId = setInterval(@intervalHandler, @interval)

class app.Scroller
  constructor: ->
    @header = $('header')
    new app.ScrollEventOptimizer(@listener, 50)

  listener: =>
    if $(window).scrollTop() > 0
      @header.addClass('fixed')
    else
      @header.removeClass('fixed')
