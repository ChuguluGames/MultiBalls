/**
* @author David <david@chugulu.com>
*/

(function($){
  
  // Special event definition.
  $.event.special.click = {
    setup: function() {
      // add fastbutton on the element if it doesnt exist yet
      if($(this).data("fastbutton") === undefined || $(this).data("fastbutton") === false) {
        // console.log("add fclick to " + $(this).attr("id"))
        $(this).data("fastbutton", new fastButton(this));
      }
    },
    teardown: function() {
      // destroy fastbutton
      $(this).unbind("click,touchstart,touchmove,touchend")
      $(this).data("fastbutton", null);
    }
  };

})(jQuery);

/*Construct the FastButton with a reference to the element and click handler.*/
var fastButton = function (element) {
  this.element = element;

  if(element.addEventListener) {
    element.addEventListener('click', this, false);
    element.addEventListener('touchstart', this, false);
  }
};

/*acts as an event dispatcher*/
fastButton.prototype.handleEvent = function(event) {
  switch(event.type) {
    case 'touchstart': this.onClick(event); break;
    case 'click': this.onClick(event); break;
  }
};
 
/*Invoke the actual click handler and prevent ghost clicks if this was a touchend event.*/
fastButton.prototype.onClick = function(event) {
  event.preventDefault();
  event.stopPropagation();

  var dispatch = jQuery.Event("click");
  
  dispatch.type = "click";
  
  switch (event.type) {
    case 'touchstart':
      dispatch.pageX = event.touches[0].clientX;
      dispatch.pageY = event.touches[0].clientY;
    break;
    case 'click':
      dispatch.pageX = event.pageX;
      dispatch.pageY = event.pageY;
    break;
  }

  $(this.element).trigger(dispatch);

  return false;
};