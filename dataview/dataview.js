/* eslint no-alert: 0 */

'use strict';



//
// Here is how to define your module
// has dependent on mobile-angular-ui
//
var app = angular.module('MobileAngularUiExamples', [
  'ngRoute',
  'mobile-angular-ui',

  // touch/drag feature: this is from 'mobile-angular-ui.gestures.js'.
  // This is intended to provide a flexible, integrated and and
  // easy to use alternative to other 3rd party libs like hammer.js, with the
  // final pourpose to integrate gestures into default ui interactions like
  // opening sidebars, turning switches on/off ..
  'mobile-angular-ui.gestures'
]);

app.run(function($transform) {
  window.$transform = $transform;
});

//
// You can configure ngRoute as always, but to take advantage of SharedState location
// feature (i.e. close sidebar on backbutton) you should setup 'reloadOnSearch: false'
// in order to avoid unwanted routing.
//
app.config(function($routeProvider) {
  $routeProvider.when('/', {templateUrl: 'home.html', reloadOnSearch: false});
  $routeProvider.when('/import', {templateUrl: 'import.html', reloadOnSearch: false});
  $routeProvider.when('/place', {templateUrl: 'place.html', reloadOnSearch: false});
  $routeProvider.when('/explore', {templateUrl: 'explore.html', reloadOnSearch: false});
  $routeProvider.when('/exploreHome', {templateUrl: 'exploreHome.html', reloadOnSearch: false});
});

//
// `$touch example`
//

app.directive('toucharea', ['$touch', function($touch) {
  // Runs during compile
  return {
    restrict: 'C',
    link: function($scope, elem) {
      $scope.touch = null;
      $touch.bind(elem, {
        start: function(touch) {
          $scope.containerRect = elem[0].getBoundingClientRect();
          $scope.touch = touch;
          $scope.$apply();
        },

        cancel: function(touch) {
          $scope.touch = touch;
          $scope.$apply();
        },

        move: function(touch) {
          $scope.touch = touch;
          $scope.$apply();
        },

        end: function(touch) {
          $scope.touch = touch;
          $scope.$apply();
        }
      });
    }
  };
}]);

//
// `$drag` example: drag to dismiss
//
app.directive('dragToDismiss', function($drag, $parse, $timeout) {
  return {
    restrict: 'A',
    compile: function(elem, attrs) {
      var dismissFn = $parse(attrs.dragToDismiss);
      return function(scope, elem) {
        var dismiss = false;

        $drag.bind(elem, {
          transform: $drag.TRANSLATE_RIGHT,
          move: function(drag) {
            if (drag.distanceX >= drag.rect.width / 4) {
              dismiss = true;
              elem.addClass('dismiss');
            } else {
              dismiss = false;
              elem.removeClass('dismiss');
            }
          },
          cancel: function() {
            elem.removeClass('dismiss');
          },
          end: function(drag) {
            if (dismiss) {
              elem.addClass('dismitted');
              $timeout(function() {
                scope.$apply(function() {
                  dismissFn(scope);
                });
              }, 300);
            } else {
              drag.reset();
            }
          }
        });
      };
    }
  };
});

//
// Another `$drag` usage example: this is how you could create
// a touch enabled "deck of cards" carousel. See `carousel.html` for markup.
//
app.directive('carousel', function() {
  return {
    restrict: 'C',
    scope: {},
    controller: function() {
      this.itemCount = 0;
      this.activeItem = null;

      this.addItem = function() {
        var newId = this.itemCount++;
        this.activeItem = this.itemCount === 1 ? newId : this.activeItem;
        return newId;
      };

      this.next = function() {
        this.activeItem = this.activeItem || 0;
        this.activeItem = this.activeItem === this.itemCount - 1 ? 0 : this.activeItem + 1;
      };

      this.prev = function() {
        this.activeItem = this.activeItem || 0;
        this.activeItem = this.activeItem === 0 ? this.itemCount - 1 : this.activeItem - 1;
      };
    }
  };
});

app.directive('carouselItem', function($drag) {
  return {
    restrict: 'C',
    require: '^carousel',
    scope: {},
    transclude: true,
    template: '<div class="item"><div ng-transclude></div></div>',
    link: function(scope, elem, attrs, carousel) {
      scope.carousel = carousel;
      var id = carousel.addItem();

      var zIndex = function() {
        var res = 0;
        if (id === carousel.activeItem) {
          res = 2000;
        } else if (carousel.activeItem < id) {
          res = 2000 - (id - carousel.activeItem);
        } else {
          res = 2000 - (carousel.itemCount - 1 - carousel.activeItem + id);
        }
        return res;
      };

      scope.$watch(function() {
        return carousel.activeItem;
      }, function() {
        elem[0].style.zIndex = zIndex();
      });

      $drag.bind(elem, {
        //
        // This is an example of custom transform function
        //
        transform: function(element, transform, touch) {
          //
          // use translate both as basis for the new transform:
          //
          var t = $drag.TRANSLATE_BOTH(element, transform, touch);

          //
          // Add rotation:
          //
          var Dx = touch.distanceX;
          var t0 = touch.startTransform;
          var sign = Dx < 0 ? -1 : 1;
          var angle = sign * Math.min((Math.abs(Dx) / 700) * 30, 30);

          t.rotateZ = angle + (Math.round(t0.rotateZ));

          return t;
        },
        move: function(drag) {
          if (Math.abs(drag.distanceX) >= drag.rect.width / 4) {
            elem.addClass('dismiss');
          } else {
            elem.removeClass('dismiss');
          }
        },
        cancel: function() {
          elem.removeClass('dismiss');
        },
        end: function(drag) {
          elem.removeClass('dismiss');
          if (Math.abs(drag.distanceX) >= drag.rect.width / 4) {
            scope.$apply(function() {
              carousel.next();
            });
          }
          drag.reset();
        }
      });
    }
  };
});

app.directive('dragMe', ['$drag', function($drag) {
  return {
    controller: function($scope, $element) {
      $drag.bind($element,
        {
          //
          // Here you can see how to limit movement
          // to an element
          //
          transform: $drag.TRANSLATE_INSIDE($element.parent()),
          end: function(drag) {
            // go back to initial position
            drag.reset();
          }
        },
        { // release touch when movement is outside bounduaries
          sensitiveArea: $element.parent()
        }
      );
    }
  };
}]);

//
// For this trivial demo we have just a unique MainController
// for everything
//
app.controller('MainController', function($rootScope, $scope) {
  if (typeof($scope.facebookMessageInboxList)=="undefined") {
    $scope.facebookMessageInboxList = [];
  }

  if (typeof($scope.natwestFile)=="undefined") {
    $scope.natwestFile = null;
  }

  if (typeof($scope.netflixFile)=="undefined") {
    $scope.netflixFile = null;
  }

  $scope.getNetflixFile = function() {
    return $scope.netflixFile;
  }

  $scope.getNatwestFile = function() {
    return $scope.natwestFile;
  }

  $scope.getFacebookMessageInboxList = function() {
    return $scope.facebookMessageInboxList;
  }

  $scope.noNetflixFile = function() {
    return typeof($scope.netflixFile)=="undefined" || $scope.netflixFile==null;
  }

  $scope.noNatwestFile = function() {
    return typeof($scope.natwestFile)=="undefined" || $scope.natwestFile==null;
  }

  $scope.noFacebookMessagesInInboxList = function() {
    return typeof($scope.facebookMessageInboxList)=="undefined" || $scope.facebookMessageInboxList.length==0;
  }

  $scope.swiped = function(direction) {
    alert('Swiped ' + direction);
  };

  // User agent displayed in home page
  $scope.userAgent = navigator.userAgent;

  // Needed for the loading screen
  $rootScope.$on('$routeChangeStart', function() {
    $rootScope.loading = true;
  });

  $rootScope.$on('$routeChangeSuccess', function() {
    $rootScope.loading = false;
  });

  // Fake text i used here and there.
  $scope.lorem = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. ' +
    'Vel explicabo, aliquid eaque soluta nihil eligendi adipisci error, illum ' +
    'corrupti nam fuga omnis quod quaerat mollitia expedita impedit dolores ipsam. Obcaecati.';

  //
  // 'Scroll' screen
  //
  var scrollItems = [];

  for (var i = 1; i <= 100; i++) {
    scrollItems.push('Item ' + i);
  }

  $scope.scrollItems = scrollItems;

  $scope.bottomReached = function() {
    alert('Congrats you scrolled to the end of the list!');
  };

  //
  // Right Sidebar
  //
  $scope.chatUsers = [
    {name: 'Carlos  Flowers', online: true},
    {name: 'Byron Taylor', online: true},
    {name: 'Jana  Terry', online: true},
    {name: 'Darryl  Stone', online: true},
    {name: 'Fannie  Carlson', online: true},
    {name: 'Holly Nguyen', online: true},
    {name: 'Bill  Chavez', online: true},
    {name: 'Veronica  Maxwell', online: true},
    {name: 'Jessica Webster', online: true},
    {name: 'Jackie  Barton', online: true},
    {name: 'Crystal Drake', online: false},
    {name: 'Milton  Dean', online: false},
    {name: 'Joann Johnston', online: false},
    {name: 'Cora  Vaughn', online: false},
    {name: 'Nina  Briggs', online: false},
    {name: 'Casey Turner', online: false},
    {name: 'Jimmie  Wilson', online: false},
    {name: 'Nathaniel Steele', online: false},
    {name: 'Aubrey  Cole', online: false},
    {name: 'Donnie  Summers', online: false},
    {name: 'Kate  Myers', online: false},
    {name: 'Priscilla Hawkins', online: false},
    {name: 'Joe Barker', online: false},
    {name: 'Lee Norman', online: false},
    {name: 'Ebony Rice', online: false}
  ];

  //
  // 'Forms' screen
  //
  $scope.rememberMe = true;
  $scope.email = 'me@example.com';

  $scope.login = function() {
    alert('You submitted the login form');
  };

  //
  // 'Drag' screen
  //
  $scope.notices = [];

  for (var j = 0; j < 10; j++) {
    $scope.notices.push({icon: 'envelope', message: 'Notice ' + (j + 1)});
  }

  $scope.deleteNotice = function(notice) {
    var index = $scope.notices.indexOf(notice);
    if (index > -1) {
      $scope.notices.splice(index, 1);
    }
  };

  /*$scope.directoryChosen = function(filesList) {
    console.log('hello');
    console.log(filesList);
    console.log(filesList[0].webkitRelativePath.split('/'));
  }*/

  $scope.toggleExploreHome= function() {
    let exploreHomeDiv=document.getElementById('exploreHome');
    if (exploreHomeDiv.style.display=="none") {
      exploreHomeDiv.style="display:inherit;";
    } else {
      exploreHomeDiv.style="display:none;";
    }
  }

  $scope.mostSent=function (a,b) {
    if (a.you_messaged_them > b.you_messaged_them)
      return -1;
    if (a.you_messaged_them < b.you_messaged_them)
      return 1;
    return 0;
  }

  $scope.rawOrganisations = {};
  $scope.sortedOrganisations = [];
  $scope.transactionsFromNatWest = [];

  $scope.topics = {}; // don't bother with sort for now. just netflix for now.

  if (typeof($scope.happenings)=="undefined") {
    $scope.happenings = {};
    $scope.transactionsAddedToHappenings = false;
    $scope.viewsAddedToHappenings = false;
  }

  $scope.getShowsFromNetflix = function() {
    let fromlocalstorage = JSON.parse(localStorage.getItem('showsFromNetflix'));
    if (typeof(fromlocalstorage)!="undefined"&&fromlocalstorage!=null&&fromlocalstorage.length>0) {
      return fromlocalstorage;
    } else {
      return $scope.topics;
    }
  }

  $scope.getTransactionsFromNatWest = function() {
    let fromlocalstorage = JSON.parse(localStorage.getItem('transactionsFromNatWest'));
    if (typeof(fromlocalstorage)!="undefined"&&fromlocalstorage!=null&&fromlocalstorage.length>0) {
      return fromlocalstorage;
    } else {
      return $scope.transactionsFromNatWest;
    }
  }

  $scope.facebookInboxMessagesToRead = null;
  $scope.facebookInboxMessagesRead = null;
  $scope.rawPeople = {};
  $scope.sortedPeople = [];

  $scope.nicePersonFormat = function(person) {
    let date_options = {
      year: 'numeric', month: 'short'
    };
    let earliest_message_month = new Date(person.earliest_timestamp).toLocaleDateString('en', date_options);
    let latest_message_month = new Date(person.latest_timestamp).toLocaleDateString('en', date_options);
    let retString = `${person.name} - you messaged them ${person.you_messaged_them} times between ${earliest_message_month} and ${latest_message_month}`;
    if (earliest_message_month == latest_message_month) {
      retString = `${person.name} - you messaged them ${person.you_messaged_them} times until ${earliest_message_month}`;
    }
    return retString;
  }

  /*$scope.biggestIncome = function (a,b) {
    if (parseFloat(a.totalIncome) > parseFloat(b.totalIncome))
      return -1;
    if (parseFloat(a.totalIncome) < parseFloat(b.totalIncome))
      return 1;
    return 0;
  }

  $scope.biggestExpense = function (a,b) {
    if (parseFloat(a.totalExpense) > parseFloat(b.totalExpense))
      return -1;
    if (parseFloat(a.totalExpense) < parseFloat(b.totalExpense))
      return 1;
    return 0;
  }*/

  $scope.mostTxs = function (a,b) {
    if (a.count > b.count)
      return -1;
    if (a.count < b.count)
      return 1;
    return 0;
  }

  $scope.niceTransactionFormat = function(tx) {
    console.log(tx);
    return `transaction`;
  }

  $scope.niceOrganisationFormat = function(org) {
    return `${org.organisation} (${org.count} transactions)`;
  }

  $scope.niceTopicFormat = function(topic) {
    return `${topic.name} (last viewed ${topic.lastViewed})`;
  }

  $scope.cleanStartAndEnd = function(txArray) {
    //console.dir(txArray);
    //console.log(txArray.length);
    // remove starting "' from first tx detail part and ending " from last tx detail part
    let last = txArray.length-1;
    if (txArray.length>1) {
      last = txArray.length-2;
    }
    if (txArray[last].charAt(txArray[last].length-1)=='"') {
      txArray[last] = txArray[last].slice(0,txArray[last].length-1);
    }
    if (txArray[0].startsWith('\"\'')) {
      txArray[0] = txArray[0].slice(2);
    }
    return txArray;
  }

  $scope.getOrganisationsFromNatwestFile = function() {
     let organisationsListDiv = document.getElementById('organisations-list');
    let parsedTransactionsFromNatWest = JSON.parse(localStorage.getItem('transactionsFromNatWest'));
    if (parsedTransactionsFromNatWest && parsedTransactionsFromNatWest.length>0) {
      $scope.transactionsFromNatWest = parsedTransactionsFromNatWest;
      if (typeof($scope.transactionsAddedToHappenings)=="undefined"||$scope.transactionsAddedToHappenings==false){
        let parsedHappenings = JSON.parse(localStorage.getItem('happenings'));
        if (typeof(parsedHappenings)!="undefined" && parsedHappenings!=null) {
          $scope.happenings = parsedHappenings;
        } else {
          $scope.happenings = [];
        }
        for (let t of $scope.transactionsFromNatWest) {
          let h = JSON.parse(JSON.stringify(t));
          h.type="transaction";
          $scope.happenings.push(h);
        }
        $scope.transactionsAddedToHappenings=true;
        $scope.happenings = $scope.shuffleArray($scope.happenings);
        localStorage.setItem('happenings',JSON.stringify($scope.happenings));
      }
    }
    let parsedSortedOrganisations = JSON.parse(localStorage.getItem('sortedOrganisations'));
    if (parsedSortedOrganisations && parsedSortedOrganisations.length>0) {
      let html = "<p>We previously found these organisations who seem like they could be important to you:</p>";
      for (let o of parsedSortedOrganisations) {
        html = html + `<p class="list-group-item"><i class="fa fa-gbp text-primary"></i>&nbsp;${$scope.niceOrganisationFormat(o)}<span class="select-partition pull-right">
                        Place organisation in&nbsp;&nbsp;<select name="partition" ngModel class="text-center">
                            <option selected='selected '[ngValue]="ignore">-- select an area --</option>
                            <option [ngValue]="Home">Home</option>
                            <option [ngValue]="Work">Work</option>
                            <option [ngValue]="Family">Family</option>
                            <option [ngValue]="Health">Health</option>
                            <option [ngValue]="Hobbies">Hobbies</option>
                            <option [ngValue]="Relationship">Relationship</option>
                            <option [ngValue]="NEW">NEW...</option>
                        </select></span></p>`;
      }
      organisationsListDiv.innerHTML = html;
    } else if (typeof($scope.natwestFile)=="undefined"||$scope.natwestFile==null) {
      organisationsListDiv.innerHTML= "No organisations found yet. Try importing your NatWest data.";
    } else {
      let transactionsFile = $scope.getNatwestFile();
      let fr = new FileReader();
      fr.onload = function() {
        let transactionsData = fr.result;
        let txArray = transactionsData.split("\r\n");
        txArray = txArray.slice(3);
        let happeningsTransactions = [];
        for (let row of txArray) {
          let parts = row.split(',');
          let date=parts[0];
          let type=parts[1];
          //let txdeets = parts[2];
          let amount = parts[parts.length-5];
          let newBalance = parts[parts.length-4];

          let accountName = parts[parts.length-3]; // acc name

          let accountNo = parts[parts.length-2]; //acc no
          let txDeets = [];
          let countOfTxDeetsParts = 0;
          for (let i = 2; i<parts.length-5; i++) {
            txDeets.push(parts[i]);
          }
          let organisation = "UNKNOWN";
          if (txDeets.length>0) {
            txDeets = $scope.cleanStartAndEnd(txDeets);
          }
          if (txDeets.length==0) {
            organisation == "UNKNOWN";
          } else if (txDeets.length==1) {
            organisation = txDeets[0].trim();
          } else if (txDeets.length==2) {
            organisation = txDeets[0].trim();
          } else if (txDeets.length==3) {
            if (txDeets[2].trim()=="VIA MOBILE - PYMT") {
              if (txDeets[0].startsWith('\"\'')) {
                organisation = txDeets[0].slice(2);
              } else {
                organisation = txDeets[0].trim();
              }
            } else {
              organisation = txDeets[1].trim();
            }
          }  else if (txDeets.length==4) {
            if (txDeets[0].split(' ').length>0) {
              let subsubparts = txDeets[0].split(' ');
              let firstPartMightBeNum=subsubparts[0];
              if (/^\d+$/.test(firstPartMightBeNum)) {
                // number, so take second part
                organisation = txDeets[1].trim(); // TODO could improve this to grab subsequent non number non FP parts.
              } else {
                organisation = txDeets[0].trim();
              }
            } else {
              organisation = txDeets[0].trim();
            }
          } else if (txDeets.length==5) {
            if (txDeets[0].split(' ').length>0) {
              let subsubparts = txDeets[0].split(' ');
              let firstPartMightBeNum=subsubparts[0];
              if (/^\d+$/.test(firstPartMightBeNum)) {
                // number, so take second part
                organisation = txDeets[1].trim(); // TODO could improve this to grab subsequent non number non FP parts.
              } else {
                organisation = txDeets[0].trim();
              }
            } else {
              organisation = txDeets[0].trim();
            }
            //console.log(organisation);
          } else if (txDeets.length==6) {
            if (txDeets[0].split(' ').length>0) {
              let subsubparts = txDeets[0].split(' ');
              let firstPartMightBeNum=subsubparts[0];
              if (/^\d+$/.test(firstPartMightBeNum)) {
                // number, so take second part
                organisation = txDeets[1].trim(); // TODO could improve this to grab subsequent non number non FP parts.
              } else {
                organisation = txDeets[0].trim();
              }
            } else {
              organisation = txDeets[0].trim();
            }
          } else if (txDeets.length==7) {
            if (txDeets[0].split(' ').length>0) {
              let subsubparts = txDeets[0].split(' ');
              let firstPartMightBeNum=subsubparts[0];
              if (/^\d+$/.test(firstPartMightBeNum)) {
                // number, so take second part
                organisation = txDeets[1].trim(); // TODO could improve this to grab subsequent non number non FP parts.
              } else {
                organisation = txDeets[0].trim();
              }
            } else {
              organisation = txDeets[0].trim();
            }
          }

          // hacks specific to my data

          if (organisation.startsWith("ROYAL BANK")) {
            organisation = "ROYAL BANK";
          }

          if (organisation.endsWith("-CHB")) {
            organisation = "CHB";
          }

          if (organisation.startsWith("CALL REF")) {
            organisation = "UNKNOWN";   // hide these call refs
          }

          if (organisation!="UNKNOWN") {
            let record = {
              date: date,
              type: amount>0 ? 'INCOME' : 'EXPENSE',
              organisation: organisation,
              amount: Math.abs(amount).toFixed(2)
            }
            happeningsTransactions.push(record);

          }
        }
        $scope.transactionsFromNatWest = happeningsTransactions;
        localStorage.setItem('transactionsFromNatWest',JSON.stringify($scope.transactionsFromNatWest));

        if (typeof($scope.transactionsAddedToHappenings)=="undefined"||$scope.transactionsAddedToHappenings==false) {
          let parsedHappenings = JSON.parse(localStorage.getItem('happenings'));
          if (typeof(parsedHappenings)!="undefined" && parsedHappenings!=null) {
            $scope.happenings = parsedHappenings;
          } else {
            $scope.happenings = [];
          }
          for (let t of $scope.transactionsFromNatWest) {
            let h = JSON.parse(JSON.stringify(t));
            h.type="transaction";
            $scope.happenings.push(h);
          }
          $scope.transactionsAddedToHappenings=true;
          $scope.happenings = $scope.shuffleArray($scope.happenings);
          localStorage.setItem('happenings',JSON.stringify($scope.happenings));
        }

        let recognisedOrgsCounts={};
        for (let tx of happeningsTransactions) {
          if (tx.organisation in recognisedOrgsCounts) {
            recognisedOrgsCounts[tx.organisation]++;
          } else {
            recognisedOrgsCounts[tx.organisation]=1;
          }
        }
        $scope.rawOrganisations = [];
        for (let entry of Object.entries(recognisedOrgsCounts)) {
          $scope.rawOrganisations.push({
            organisation:entry[0],
            count:entry[1]});
        }
        $scope.sortedOrganisations = $scope.rawOrganisations.sort($scope.mostTxs);
        localStorage.setItem('sortedOrganisations',JSON.stringify($scope.sortedOrganisations));
        let html = "<p>We found these organisations who seem like they could be important to you:</p>";
        for (let o of $scope.sortedOrganisations) {
          html = html + `<p class="list-group-item"><i class="fa fa-gbp text-primary"></i>&nbsp;${$scope.niceOrganisationFormat(o)}<span class="select-partition" class="pull-right">
                        Place organisation in&nbsp;&nbsp;<select name="partition" ngModel class="text-center">
                            <option selected='selected '[ngValue]="ignore">-- select an area --</option>
                            <option [ngValue]="Home">Home</option>
                            <option [ngValue]="Work">Work</option>
                            <option [ngValue]="Family">Family</option>
                            <option [ngValue]="Health">Health</option>
                            <option [ngValue]="Hobbies">Hobbies</option>
                            <option [ngValue]="Relationship">Relationship</option>
                            <option [ngValue]="NEW">NEW...</option>
                        </select></span></p>`;
        }
        organisationsListDiv.innerHTML = html;
      }
      fr.readAsText(transactionsFile);
    }

  };

  $scope.parseDMY = function (value) {
    var date = value.split("/");
    var d = parseInt(date[0], 10),
      m = parseInt(date[1], 10),
      y = parseInt(date[2], 10);
    return new Date(y, m - 1, d);
  }

  $scope.shuffleArray = function (array) {
    let currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }


  $scope.getTopicsFromNetflixViewsList = function() {
    let topicsListDiv = document.getElementById('topics-list');
    let parsedShowsFromNetflix = JSON.parse(localStorage.getItem('showsFromNetflix'));
    if (parsedShowsFromNetflix && parsedShowsFromNetflix.length>0) {
      $scope.topics = parsedShowsFromNetflix;
      if (typeof($scope.viewsAddedToHappenings)=="undefined"||$scope.viewsAddedToHappenings==false) {
        let parsedHappenings = JSON.parse(localStorage.getItem('happenings'));
        if (typeof(parsedHappenings)!="undefined" && parsedHappenings!=null) {
          $scope.happenings = parsedHappenings;
        } else {
          $scope.happenings = [];
        }

        for (let t of $scope.topics) {
          let h = JSON.parse(JSON.stringify(t));
          h.type="view";
          $scope.happenings.push(h);
        }
        $scope.viewsAddedToHappenings=true;
        $scope.happenings = $scope.shuffleArray($scope.happenings);
        localStorage.setItem('happenings',JSON.stringify($scope.happenings));
      }
    }
    if (parsedShowsFromNetflix && parsedShowsFromNetflix.length>0) {
      let html = "<p>We previously found these topics which seem like they could be important to you:</p>";
      for (let t of parsedShowsFromNetflix) {
        html = html + `<p class="list-group-item"><i class="fa fa-television text-primary"></i>&nbsp;${$scope.niceTopicFormat(t)}<span class="select-partition pull-right">
                        Place topic in&nbsp;&nbsp;<select name="partition" ngModel class="text-center">
                            <option selected='selected '[ngValue]="ignore">-- select an area --</option>
                            <option [ngValue]="Home">Home</option>
                            <option [ngValue]="Work">Work</option>
                            <option [ngValue]="Family">Family</option>
                            <option [ngValue]="Health">Health</option>
                            <option [ngValue]="Hobbies">Hobbies</option>
                            <option [ngValue]="Relationship">Relationship</option>
                            <option [ngValue]="NEW">NEW...</option>
                        </select></span></p>`;
      }
      topicsListDiv.innerHTML = html;
    } else if (typeof($scope.netflixFile)=="undefined"||$scope.netflixFile==null) {
      topicsListDiv.innerHTML= "No topics found yet. Try importing your Netflix data.";
    } else {
      let netflixFile = $scope.getNetflixFile();
      let fr = new FileReader();
      fr.onload = function() {
        let showsData = fr.result;
        let netflixArray = showsData.split("\n");
        netflixArray = netflixArray.slice(1);
        let thingsIveWatched={};
        for (let view in netflixArray) {
          let dataParts = netflixArray[view].split(',');
          let date = dataParts[dataParts.length-1];
          let simplifiedName=dataParts[0]; // should really append any parts in between first and nth column if > 2 cols.
          if (simplifiedName.indexOf(':')>-1) {
            let nameParts = simplifiedName.split(':');
            simplifiedName=nameParts[0];
          }
          if (simplifiedName.startsWith('"')) {
            simplifiedName=simplifiedName.slice(1);
          }
          if (simplifiedName.endsWith('"')) {
            simplifiedName=simplifiedName.slice(0,-1);
          }
          if (date.startsWith('"')) {
            date=date.slice(1);
          }
          if (date.endsWith('"')) {
            date=date.slice(0,-1);
          }

          if (simplifiedName in thingsIveWatched) {
            //console.log('matched '+"|"+simplifiedName+"|"+date+"|"+parseDMY(date));
            thingsIveWatched[simplifiedName].views = parseInt(thingsIveWatched[simplifiedName].views) + parseInt(1);
            if ($scope.parseDMY(thingsIveWatched[simplifiedName].lastViewed) < $scope.parseDMY(date)) {
              thingsIveWatched[simplifiedName].lastViewed = date;
            };
            if ($scope.parseDMY(thingsIveWatched[simplifiedName].firstViewed) > $scope.parseDMY(date)) {
              thingsIveWatched[simplifiedName].firstViewed = date;
            };
          } else {
            //console.log('first add '+"|"+simplifiedName+"|"+date);
            thingsIveWatched[simplifiedName]={
              name:simplifiedName,
              firstViewed:date,
              lastViewed:date,
              views:1
            };
          }
        }

        $scope.topics = [];
        for (let entry of Object.entries(thingsIveWatched)) {
          $scope.topics.push(entry[1]);
        }
        localStorage.setItem('showsFromNetflix',JSON.stringify($scope.topics));

        if (typeof($scope.viewsAddedToHappenings)=="undefined" || $scope.viewsAddedToHappenings==false) {
          let parsedHappenings = JSON.parse(localStorage.getItem('happenings'));
          if (typeof(parsedHappenings)!="undefined" && parsedHappenings!=null) {
            $scope.happenings = parsedHappenings;
          } else {
            $scope.happenings = [];
          }
          for (let t of $scope.topics) {
            let h = JSON.parse(JSON.stringify(t));
            h.type="view";
            $scope.happenings.push(h);
          }
          $scope.viewsAddedToHappenings=true;
          $scope.happenings = $scope.shuffleArray($scope.happenings);
          localStorage.setItem('happenings',JSON.stringify($scope.happenings));
        }

        let html = "<p>We found these topics which seem like they could be important to you:</p>";
        for (let t of $scope.topics) {
          html = html + `<p class="list-group-item"><i class="fa fa-television text-primary"></i>&nbsp;${$scope.niceTopicFormat(t)}<span class="select-partition pull-right">
                        Place topic in&nbsp;&nbsp;<select name="partition" ngModel class="text-center">
                            <option selected='selected '[ngValue]="ignore">-- select an area --</option>
                            <option [ngValue]="Home">Home</option>
                            <option [ngValue]="Work">Work</option>
                            <option [ngValue]="Family">Family</option>
                            <option [ngValue]="Health">Health</option>
                            <option [ngValue]="Hobbies">Hobbies</option>
                            <option [ngValue]="Relationship">Relationship</option>
                            <option [ngValue]="NEW">NEW...</option>
                        </select></span></p>`;
        }
        topicsListDiv.innerHTML = html;
      }
      fr.readAsText(netflixFile);
    }

  };

  $scope.getPeopleFromFacebookMessageInboxList = function() {
    let peopleListDiv = document.getElementById('people-list');
    let parsedSortedPeople = JSON.parse(localStorage.getItem('sortedPeople'));
    if (parsedSortedPeople && parsedSortedPeople.length>0) {
      let html = "<p>We previously found these people who seem like they could be important to you:</p>";
      for (let p of parsedSortedPeople) {
        if (p.you_messaged_them>49) {
          html = html + `<p class="list-group-item"><i class="fa fa-facebook text-primary"></i>&nbsp;${$scope.nicePersonFormat(p)}<span class="select-partition pull-right">
                        Place person in&nbsp;&nbsp;<select name="partition" ngModel class="text-center">
                            <option selected='selected '[ngValue]="ignore">-- select an area --</option>
                            <option [ngValue]="Home">Home</option>
                            <option [ngValue]="Work">Work</option>
                            <option [ngValue]="Family">Family</option>
                            <option [ngValue]="Health">Health</option>
                            <option [ngValue]="Hobbies">Hobbies</option>
                            <option [ngValue]="Relationship">Relationship</option>
                            <option [ngValue]="NEW">NEW...</option>
                        </select></span></p>`;
        }
      }
      peopleListDiv.innerHTML = html;
    } else if (typeof($scope.facebookMessageInboxList)=="undefined"||$scope.facebookMessageInboxList.length==0) {
      peopleListDiv.innerHTML= "No people found yet. Try importing your Facebook data.";
    } else {
      let me="Alex Bowyer"; //TODO move this to UI, don't hardcode
      let inboxList = $scope.getFacebookMessageInboxList();
      $scope.facebookInboxMessagesToRead=inboxList.length;
      $scope.facebookInboxMessagesRead=0;
      for (let messageFile of $scope.getFacebookMessageInboxList()) {
        let fr = new FileReader();
        fr.onload = function() {
          let obj = JSON.parse(fr.result);
          let participants = [];
          let message_count = 0;
          let message_out_count = 0;
          let message_in_count =0;
          let latest_timestamp = null;
          let earliest_timestamp = null;
          for (let p of obj.participants) {
            if (p.name!=me && p.name!="Facebook User") {
              participants.push(p.name);
            }
          }
          //console.log(participants);
          for (let m of obj.messages) {
            if (m.sender_name==me) { message_out_count++; } else {message_in_count++; }
            if (!earliest_timestamp) {
              earliest_timestamp = m.timestamp_ms;
            }
            if (!latest_timestamp || (m.timestamp_ms > latest_timestamp)) {
              latest_timestamp = m.timestamp_ms;
            }
          }
          message_count = message_in_count+message_out_count;

          // only look at 1:1 conversations for now
          if (participants.length==1) {
            let name = participants[0];
            //console.log(name);
            let person = {
              name: name,
              you_messaged_them: message_out_count,
              they_messaged_you: message_in_count,
              total_interactions: message_count,
              earliest_timestamp: earliest_timestamp,
              latest_timestamp: latest_timestamp
            };
            if (name in $scope.rawPeople) {
              // combine new message with existing record for this person
              $scope.rawPeople[name].you_messaged_them += message_out_count;
              $scope.rawPeople[name].they_messaged_you += message_in_count;
              $scope.rawPeople[name].total_interactions += message_count;
              if ( $scope.rawPeople[name].earliest_timestamp > person.earliest_timestamp) {
                $scope.rawPeople[name].earliest_timestamp = person.earliest_timestamp;
              }
              if ( $scope.rawPeople[name].latest_timestamp < person.latest_timestamp) {
                $scope.rawPeople[name].latest_timestamp = person.latest_timestamp;
              }
            } else {
              // add new record for new person
              $scope.rawPeople[name] = person;
            }
          }

          $scope.facebookInboxMessagesRead++;
          let peopleListDiv = document.getElementById('people-list');
          peopleListDiv.innerHTML = "Analysing Facebook message inbox... ["+$scope.facebookInboxMessagesRead+"/"+$scope.facebookInboxMessagesToRead+"]";

          if ($scope.facebookInboxMessagesRead==$scope.facebookInboxMessagesToRead) {
            let unsortedPeople = [];
            for (let entry of Object.entries( $scope.rawPeople)) {
              unsortedPeople.push(entry[1]);
            }
            //console.dir(unsortedPeople);
            // most messages sent by you
            $scope.sortedPeople = unsortedPeople.sort($scope.mostSent);
            localStorage.setItem('sortedPeople',JSON.stringify($scope.sortedPeople));
            //console.dir($scope.sortedPeople);
            let html = "<p>We found these people who seem like they could be important to you:</p>";
            for (let p of $scope.sortedPeople) {
              if (p.you_messaged_them>49) {
                html = html + `<p class="list-group-item"><i class="fa fa-facebook text-primary"></i>&nbsp;${$scope.nicePersonFormat(p)}<span class="select-partition pull-right">
                        Place person in&nbsp;&nbsp;<select name="partition" ngModel class="text-center">
                            <option selected='selected '[ngValue]="ignore">-- select an area --</option>
                            <option [ngValue]="Home">Home</option>
                            <option [ngValue]="Work">Work</option>
                            <option [ngValue]="Family">Family</option>
                            <option [ngValue]="Health">Health</option>
                            <option [ngValue]="Hobbies">Hobbies</option>
                            <option [ngValue]="Relationship">Relationship</option>
                            <option [ngValue]="NEW">NEW...</option>
                        </select></></p>`;
              }
            }
            peopleListDiv.innerHTML = html;
            //$scope.facebookInboxMessagesRead = null;
            //$scope.facebookInboxMessagesToRead = null;
          }
        };
        fr.readAsText(messageFile);
      }
    }
  }

  $scope.showPeople = function() {
    $scope.getPeopleFromFacebookMessageInboxList();
  }

  $scope.showOrganisations = function() {
    $scope.getOrganisationsFromNatwestFile();
  }

  $scope.showPlaces = function() {
    $scope.getPlacesFromGoogleLocationsList();
  }

  $scope.showTopics = function() {
    $scope.getTopicsFromNetflixViewsList();
  }

  $scope.getPlacesFromGoogleLocationsList = function() {
    return null;
  }


  $scope.deleteExtractedOrganisationsData = function() {
    $scope.natwestFile=null;
    localStorage.removeItem('sortedOrganisations');
    localStorage.removeItem('transactionsFromNatWest');
    let organisationsDiv = document.getElementById('organisations-list');
    organisationsDiv.innerHTML="<p>Press \"Find Organisations\" to analyse your loaded NatWest data and find Organisations.</p>";
  }

  $scope.deleteExtractedPlacesData = function() {
    return null;
  }

  $scope.deleteExtractedTopicsData = function() {
    $scope.netflixFile=null;
    localStorage.removeItem('showsFromNetflix');
    let topicsDiv = document.getElementById('topics-list');
    topicsDiv.innerHTML="<p>Press \"Find Topics\" to analyse your loaded Netflix data and find Topics.</p>";
  }

  $scope.deleteExtractedPeopleData = function() {
    localStorage.removeItem('facebookInbox');
    localStorage.removeItem('sortedPeople');
    let peopleDiv = document.getElementById('people-list');
    peopleDiv.innerHTML="<p>Press \"Find People\" to analyse your loaded Facebook data and find People.</p>";
  }

  $scope.natwestSubmit = function($event) {
    switch($event.submitter.id) {
      case "loadNatwestData": {
        let files = $event.explicitOriginalTarget.elements[1].files;
        if (files.length>0) {
          $scope.natwestFile = files[0];
          document.getElementById('loadNatwestData').style = "display:none;";
          document.getElementById('deleteNatwestData').style = "display:inherit;";
          document.getElementById('natwestLoaded').style = "display:inherit;";
          document.getElementById('natwestNotLoaded').style = "display:none;";
        } else {
          alert("Use the Browse button to pick the file first!");
        }
        break;
      }
      case "deleteNatwestData": {
        $scope.natwestFile=null;
        document.getElementById('deleteNatwestData').style="display:none;";
        document.getElementById('loadNatwestData').style="display:inherit;";
        document.getElementById('natwestFileInput').value=null;
        document.getElementById('natwestNotLoaded').style="display:inherit;";
        document.getElementById('natwestLoaded').style="display:none;";
        break;
      }
      default: {
        break;
      }
    }
    //console.log($event.submitter.id);

  };

  $scope.netflixSubmit = function($event) {
    switch($event.submitter.id) {
      case "loadNetflixData": {
        let files = $event.explicitOriginalTarget.elements[1].files;
        if (files.length>0) {
          $scope.netflixFile = files[0];
          document.getElementById('loadNetflixData').style = "display:none;";
          document.getElementById('deleteNetflixData').style = "display:inherit;";
          document.getElementById('netflixLoaded').style = "display:inherit;";
          document.getElementById('netflixNotLoaded').style = "display:none;";
        } else {
          alert("Use the Browse button to pick the file first!");
        }
        break;
      }
      case "deleteNetflixData": {
        $scope.netflixFile=null;
        document.getElementById('deleteNetflixData').style="display:none;";
        document.getElementById('loadNetflixData').style="display:inherit;";
        document.getElementById('netflixFileInput').value=null;
        document.getElementById('netflixNotLoaded').style="display:inherit;";
        document.getElementById('netflixLoaded').style="display:none;";
        break;
      }
      default: {
        break;
      }
    }
    //console.log($event.submitter.id);

  };

  $scope.facebookSubmit = function($event) {
    switch($event.submitter.id) {
      case "loadFacebookData": {
        let files = $event.explicitOriginalTarget.elements[1].files;
        if (files.length>0) {
          for (let f of files) {
            let filenameParts = f.webkitRelativePath.split('/');
            if (filenameParts[1] == "messages" && filenameParts[2] == "inbox" && f.name == "message_1.json") {
              $scope.facebookMessageInboxList.push(f);
            }
          }
          document.getElementById('loadFacebookData').style = "display:none;";
          document.getElementById('deleteFacebookData').style = "display:inherit;";
          document.getElementById('facebookLoaded').style = "float:right;display:inherit;";
          document.getElementById('facebookNotLoaded').style = "float:right;display:none;";
        } else {
          alert("Use the Browse button to pick the folder first!");
        }
        break;
      }
      case "deleteFacebookData": {
        $scope.facebookMessageInboxList=[];
        document.getElementById('deleteFacebookData').style="display:none;";
        document.getElementById('loadFacebookData').style="display:inherit;";
        document.getElementById('facebookDirectoryInput').value=null;
        document.getElementById('facebookNotLoaded').style="float:right;display:inherit;";
        document.getElementById('facebookLoaded').style="float:right;display:none;";
        break;
      }
      default: {
        break;
      }
    }
    //console.log($event.submitter.id);

  };


});
