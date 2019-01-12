var token = 'tmp_123';
var user_id = 2;
var domain = 'https://awesome-robot.com/ff/';


window.fn = {};

window.fn.toggleMenu = function () {
  document.getElementById('appSplitter').right.toggle();
};

window.fn.loadView = function (index) {
  document.getElementById('appTabbar').setActiveTab(index);
  document.getElementById('sidemenu').close();
};

window.fn.loadLink = function (url) {
  window.open(url, '_blank');
};


goPage = function (page, anim) {
    //document.getElementById('appNavigator').pushPage(page.id, { data: { title: page.title } });
    document.getElementById('appNavigator').pushPage(page.id, { data: { page } });
};

tabPage = function (page) {
  document.getElementById('appTabbar').setActiveTab(page.index);
  document.getElementById('sidemenu').close();
  document.getElementById('appNavigator').resetToPage('appTabbar');
}



function ucwords (str) {
    return (str + '').replace(/^([a-z])|\s+([a-z])/g, function ($1) {
        return $1.toUpperCase();
    });
}

function handle_fail(response) {
  var responseText = JSON.parse(response.responseText);
  ons.notification.toast('An Error has occurred: <br>' + responseText.error + "<button onclick='$(this).parent().hide();'>ok</button>", { timeout: 10000, animation: 'fall' })
}

function handle_return(e) {
    $("#load-modal").hide();
    if (e.success) {
      return true;
    } else {
      var this_toast = ons.notification.toast('<b>Error:</b><br>' + e.error + "<button onclick='$(this).parent().hide();'>ok</button>", { timeout: 10000, animation: 'fall' })
    }
}



function populate_manage_profile() {
  $("#load-modal").show();
  $.ajax({
      url: domain + 'feeds/ppl_profile.php',
      data: { token: token },
      cache: false,
      dataType: 'json',
      success: function(data) {
        if(handle_return(data)) {
          $("#profile_display_name").val(data.results[0].display_name);
          $("#profile_birthdate").val(data.results[0].dob);
          $("#profile_description").val(decodeURI(data.results[0].description.replace(/&#(\d+);/g, function(match, dec) { return String.fromCharCode(dec); })));
          $("#load-modal").hide();
        }
      }
    });
}


function save_profile() {
  $("#load-modal").show();
  $.ajax({
      cache: false,
      url: domain + 'feeds/ppl_sv_profile.php',
      method: 'POST',
      data: { token: token,
              display_name: $("#profile_display_name").val(),
              dob: $("#profile_birthdate").val(),
              description: $("#profile_description").val()
            },
      dataType: 'json',
      success: function(data) {
       $("#load-modal").hide();
       if (data.success) {
          ons.notification.alert('Your profile has been saved!');
       } else {
          ons.notification.alert('An error has occured trying to save your profile.<p><b>Error:</b><br> ' + data.error + '<p><b>Query:</b> <br>' + data.query);
       }
      }
    });
}





function friendwall() {
  
    var item = createAlertCard({'page':'your-events.html','message':'You have three upcoming events!','caption':'Your Events'});
    $('#wall').append(item);
  
    i = 0;
    $.ajax({
      url: domain + 'feeds/wall_list.php',
      data: { token: token },
      cache: false,
      dataType: 'json',
      success: function(data) {
        $.each( data.results, function( key, value ) {
          $('#wall').append(createCard({'img': value.thumbnail,
                                       'attr': '{"id":"profile.html","person_id":"'+value.person_id+'"}',
                                      'descr':  '<span style="float:right"><small>' + value.date_posted +'</small></span><div class="content">' + value.status + '</div>',
                                    'caption':  value.display_name,
                                  'rightpill':''}));
        });
      }
    });
}


function post_status() {
  $.getJSON(domain + 'feeds/wall_sv_status.php',{ token:token, status:$("#status-input").val() })
    .done(function(e) {
        $("#status-input").val('');
        $("#wall").html('');
        friendwall();
     })
    .fail(function(e) {handle_fail(e)});
};


function people(attributes,start = 0) {
    //console.log(attributes);
    $.ajax({
      url: domain + 'feeds/ppl_search.php',
      cache: false,
      data: { token: token,
              search:   $('#people_search').val(),
              gyms:     $('#people_gyms').val(),
              gender:   $('#people_gender').val(),
              distance: $('#people_distance').val(),
              /*activity: attributes.activity_id,*/
              start:    start
            },
      dataType: 'json',
      success: function(data) {
        if(handle_return(data)) {
          $.each( data.results, function( key, value ) {
            //console.log(value);
            $('#people').append(createCard({'img':      value.picture_th,
                                            'attr':     '{"id":"profile.html","person_id":"'+value.id+'"}',
                                            'descr':    value.age + "" + value.gender + " - " + ucwords(value.city) + ", " + ucwords(value.state),
                                            'caption':  value.display_name,
                                            'rightpill':''}));
          });
        }
        $("#people-loader").fadeOut();
      }
    });
}


function loadProfile(person_id) {
  $("#load-modal").show();
  $.ajax({
      url: domain + 'feeds/ppl_profile.php',
      cache: false,
      data: { token: token,
              person_id: person_id
            },
      dataType: 'json',
      success: function(data) {
        if(handle_return(data)) {
          
          if(data.results[0].id==user_id)  {
            $("#profile-spd").hide();
          } else {
            $("#profile-spd").show();
          }
          
          var gyms = data.results[0].gyms.split("|");
          var activities = data.results[0].activities.split("|");
          $("#profile-title").text(data.results[0].display_name);
          $("#profile-paragraph").html(data.results[0].description.replace('\n', '<br />'));
          $("#profile-stats").text(data.results[0].age + "" + data.results[0].gender + " - " + ucwords(data.results[0].city) + ", " + ucwords(data.results[0].state));
          $("#profile-activities").html('');
          if (activities != '') {
            $.each( activities, function( key, value ) {
              $('#profile-activities').append(createListItem({'onClick':'tabPage({\'index\': \'1\', \'activity_id\': \''+value.split('~~')[0]+'\'})',
                                                                 'text': '<div style="width:60px"></div>' + value.split('~~')[1],
                                                              }));
            });
          } else {
            $('#profile-activities').html('<center><i><small>' + data[0].display_name + ' has not picked any activities.</small></i></center>');
          }
          $("#profile-gyms").html('');
          if (gyms != '') {
            $.each( gyms, function( key, value ) {
              $('#profile-gyms').append(createListItem({'onClick':'goPage({\'id\': \'gym.html\', \'gym_id\': \''+value.split('~~')[0]+'\'})',
                                                           'img': domain + 'img/gym/' + value.split('~~')[1],
                                                           'text': value.split('~~')[2],
                                                        }));
            });
          } else {
            $('#profile-gyms').html('<center><i><small>' + data.results[0].display_name + ' has not joined any gyms.</small></i></center>');
          }
          $("#profile-groups").html('');
          
          
          
          
          $("#load-modal").hide();
        }
      }
    });
}

function gyms(start = 0) {
    $.ajax({
      url: domain + 'feeds/gym_info.php',
      cache: false,
      data: { token: token,
              search:   $('#gym_search').val(),
              start: start
            },
      dataType: 'json',
      success: function(data) {
        if(handle_return(data)) {
          $.each( data.results, function( key, value ) {
            $('#gyms').append(createCard({'img':      domain + 'img/gym/' + value.image,
                                          'attr':     '{"id":"gym.html","gym_id":"'+value.id+'"}',
                                          'descr':    value.address + '<br>' + value.city + ', ' + value.state + '<br><i>' + value.distance + ' mile' + (value.distance==1?'':'s') + ' away</i>',
                                          'caption':  value.name,
                                          'rightpill': (value.member==1?'<i class="fas fa-home"></i>':false)} ));
  
          });
        }
        $("#gym-loader").fadeOut();
      }
    });
}

function getGymInfo(gym_id) {
    $("#load-modal").show();
    $("#join-gym").hide();
    $("#leave-gym").hide();
    
    $.ajax({
      url: domain + 'feeds/gym_info.php',
      data: { token: token,
              gym_id:gym_id
            },
      cache: false,
      dataType: 'json',
      success: function(gym_info) {
        if(handle_return(gym_info)) {
          $("#gym_name").text(gym_info.results[0]['name']);
          $("#gym_image").attr('src',domain + 'img/gym/' + gym_info.results[0].image);
          $("#gym_map").attr('src',domain + 'img/gym/header/' + gym_info.results[0].header_img);
          $("#gym_address").html('<b>' + gym_info.results[0].name + '</b><br>' + gym_info.results[0].address + '<br>' + gym_info.results[0].city + ', ' + gym_info.results[0].state + '<br><i>' + gym_info.results[0].distance + ' mile' + (gym_info.results[0].distance==1?'':'s') + ' away</i>');
          if (gym_info.results[0].member==1) {
            $("#leave-gym").show(); 
          } else {
            $("#join-gym").show();
          }
        }
        $("#load-modal").hide();
      }
    });
}

function getGymMembers(gym_id) {
    $.ajax({
      url: domain + 'feeds/gym_members.php',
      data: { token: token,
              gym_id:gym_id
            },
      cache: false,
      dataType: 'json',
      success: function(data) {
        if(handle_return(data)) {
          $.each( data.results, function( key, value ) {
            $('#members').append(createCard({'img':      value.picture_th,
                                             'attr':     '{"id":"profile.html","person_id":"'+value.id+'"}',
                                             'descr':    value.age + "" + value.gender + " - " + ucwords(value.city) + ", " + ucwords(value.state),
                                             'caption':  value.display_name,
                                             'rightpill':''}));
            });
        }
      }
    });
}

function joinGym(gym_id) {
    $.ajax({
      url: domain + 'feeds/gym_sv_membership.php',
      data: { token: token,
              gym_id:gym_id,
              action:'join'
            },
      cache: false,
      dataType: 'json',
      success: function(data) {
        if(handle_return(data)) {
          ons.notification.toast('You have joined the gym!', { timeout: 1000, animation: 'fall' })
          $("#join-gym").hide();
          $("#leave-gym").show();
          $("#gyms").html('');
        }
        gyms();
      }
    });
}

function leaveGym(gym_id) {
    $.ajax({
      url: domain + 'feeds/gym_sv_membership.php',
      data: { token: token,
              gym_id:gym_id,
              action:'leave'
            },
      cache: false,
      dataType: 'json',
      success: function(data) {
        if(handle_return(data)) {
          ons.notification.toast('You have left the gym.', { timeout: 1000, animation: 'fall' })
          $("#join-gym").show();
          $("#leave-gym").hide();
          $("#gyms").html('');
        }
        gyms();
      }
    });
}

function events() {
  for(x=0;x<=25;x++) {
      var card;
      card =        '<ons-card onclick=\'fn.pushPage({"id": "event.html", "title": "&nbsp;&nbsp;&nbsp;Random Sports Event"})\'>';
      card = card + '    <div class="thumbnail"><img src="http://placeimg.com/60/60/people?new='+Math.random()+'"/></div>';
      card = card + '    <div class="title">Random Sports Event '+ Math.floor(Math.random() * 100) +'</div>';
      card = card + '    <div class="content">10/31/2018 - Local Sports Arena</div>';
      card = card + '</ons-card>';
      $("#events").append(card);
  }
}

function groups() {
  for(x=0;x<=25;x++) {
      var card;
      card =        '<ons-card onclick=\'fn.pushPage({"id": "group.html", "title": "&nbsp;&nbsp;&nbsp;Random Sports Group"})\'>';
      card = card + '    <div class="thumbnail"><img src="http://placeimg.com/60/60/people?new='+Math.random()+'"/></div>';
      card = card + '    <div class="title">Random Group '+ Math.floor(Math.random() * 100) +'</div>';
      card = card + '    <div class="content">Short Description of Group</div>';
      card = card + '</ons-card>';
      $("#groups").append(card);
  }
}

function messageList() {
    var params = { token: token }
    var url = domain + 'feeds/msg_list.php';
    $.getJSON(url,params)
     .done(function(data) { if(handle_return(data)) {
          $.each( data.results, function( key, value ) {
           var item = createCard({'img':value.picture_th,'attr':'{"id":"message.html","person_id":'+value.person_id+'}','descr':value.fuzzy_date,'caption': value.display_name,'rightpill':value.status});
           $('#message-list').append(item);
          });
      } })
     .fail(function(data) {handle_fail(data)});
}



function eventList() {
    $.ajax({
      url: '//randomuser.me/api/?results=3',
      dataType: 'json',
      success: function(data) {
        $.each( data.results, function( key, value ) {
          $('#event-list').append(createCard({'img':value.picture.thumbnail,
                                              'attr':  "{'id':'event.html'}",
                                              'descr':'03/08/2019 - Texas Public Park',
                                              'caption':'Random Sports Event '+ Math.floor(Math.random() * 100),
                                              'rightpill':''}));
        });
      }
    });
}


function groupList() {
    for(x=0;x<=5;x++) {
      $('#group-list').append(createCard({'img':      'http://placeimg.com/50/50/people?new='+Math.random(),
                                          'attr':     "{'id':'event.html'}",
                                          'descr':    Math.floor(Math.random() * 100) + ' new comments',
                                          'caption':  'Random Group '+ Math.floor(Math.random() * 100)}));  
    }
}

window.latest_message = [];
function getUserMessages(person_id, latest = 0) {
    if (latest == 0) {
        $("#person_messages").html('');
    }
    var params = { token:       token,
                   person_id:   person_id,
                   latest_msg:  latest
                 }
    var url = domain + 'feeds/msg_messages.php';
    $.getJSON(url,params)
     .done(function(data) { if(handle_return(data)) {
          $.each( data.results, function( key, value ) {
            var item = createListItem({'img':value.picture_th,'text':value.message},value.dir);
            $("#person_messages").append(item);
            window.latest_message[person_id] = value.id;
          });
          $('#person_messages').parent().scrollTop(1E10);
      } })
     .fail(function(data) {handle_fail(data)});
}




function sendMessage(person_id) {
    $.getJSON(domain + 'feeds/msg_sv_send.php',{ token: token, person_id:   person_id, message: $("#send_message").val() })
    .done(function(e) { if(handle_return(e)) {
       getUserMessages(person_id,window.latest_message[person_id]);
       $("#send_message").val('')
     } })
    .fail(function(e) {handle_fail(e)});
}


function handle_friend(index,person_id,display_name) {
    switch (index) {
        case 0:
          goPage({"id": "message.html", "person_id": person_id, "display_name": display_name});
          break;
        case 1:
          goPage({"id": "profile.html", "person_id": person_id});
          break;
        default:
    }
}


function friendList() {
    var params = { token: token };
    var url = domain + 'feeds/ppl_friends.php'
    $.getJSON(url,params)
     .done(function(data) { if(handle_return(data)) {
          $.each( data.results, function( key, value ) {
            actionsheet_vals = "                 {       title: '"+value.display_name+"',";
            //actionsheet_vals = actionsheet_vals + "destructive: 1,";
            actionsheet_vals = actionsheet_vals + " cancelable: true,";
            actionsheet_vals = actionsheet_vals + "    buttons: [";
            actionsheet_vals = actionsheet_vals + "      {";
            actionsheet_vals = actionsheet_vals + "         label: 'Messages',";
            actionsheet_vals = actionsheet_vals + "          icon: 'md-email'";
            actionsheet_vals = actionsheet_vals + "      },{";
            actionsheet_vals = actionsheet_vals + "         label: 'View Profile',";
            actionsheet_vals = actionsheet_vals + "          icon: 'md-face'";
            actionsheet_vals = actionsheet_vals + "      },{";
            actionsheet_vals = actionsheet_vals + "         label: 'Cancel',";
            //actionsheet_vals = actionsheet_vals + "      modifier: 'destructive',";
            actionsheet_vals = actionsheet_vals + "          icon: 'md-close'";
            actionsheet_vals = actionsheet_vals + "      }],";
            actionsheet_vals = actionsheet_vals + "}";
            
            var item = createListItem({'onClick': "ons.openActionSheet("+actionsheet_vals +").then(function (index) { handle_friend(index,"+value.id+",'"+value.display_name+"') })", 
                                       'img':value.picture_th,
                                       'text':value.display_name
                                       });
            document.getElementById('friend-list').appendChild(item);
          });
      } })
     .fail(function(data) {handle_fail(data)});
}

function attendeeList() {
    $.ajax({
      url: '//randomuser.me/api/?results=25',
      dataType: 'json',
      success: function(data) {
        $.each( data.results, function( key, value ) {
          var item = createListItem({'onClick' : "fn.pushPage({'id': 'profile.html', 'title': '&nbsp;&nbsp;&nbsp;Jamie Hildreth'})",
                                     'img':value.picture.thumbnail,
                                     'text':ucwords(value.name.first) + ' ' + ucwords(value.name.last)
                                     });
          document.getElementById('attendee-list').appendChild(item);
        });
      }
    });
}

function discussionList() {
    $.ajax({
      url: '//randomuser.me/api/?results=3',
      dataType: 'json',
      success: function(data) {
        $.each( data.results, function( key, value ) {
          var item = createCard({'page':'discussion.html','img':value.picture.thumbnail,'descr':'03/08/2019 - ' + ucwords(value.name.first) + ' ' + ucwords(value.name.last),'caption':'Group Discussion '+ Math.floor(Math.random() * 100),'rightpill':''});
          document.getElementById('discussion-list').appendChild(item);
        });
      }
    });
}

function discussionComments() {
    var i=0;
    $.ajax({
      url: '//randomuser.me/api/?results=3',
      dataType: 'json',
      success: function(data) {
        $.each( data.results, function( key, value ) {
          var item = createCard({'page':'profile.html','img':value.picture.thumbnail,'descr':'03/08/2019 - ' + ucwords(value.name.first) + ' ' + ucwords(value.name.last),'caption':sample_statuses[i++],'rightpill':''});
          document.getElementById('discussion-comments').appendChild(item);
        });
      }
    });
}

function activityList() {
    $.ajax({
      url: domain + 'feeds/act_list.php',
      cache: false,
      data: { token:  token },
      dataType: 'json',
      success: function(data) {

        if(handle_return(data)) {
          $.each( data.results, function( key, value ) {
            $('#activity-list').append(ons.createElement(`<ons-list-item tappable>
                                                            <label class="left">
                                                              <ons-checkbox input-id="activity-`+value.id+`" `+(value.participant==1?'checked':'')+` onChange='saveActivity(`+value.id+`)'></ons-checkbox>
                                                            </label>
                                                            <label for="activity-`+value.id+`" class="center">
                                                              `+value.activity_descr+`
                                                            </label>
                                                          </ons-list-item>`));
          });
        }
        
        $("#gym-loader").fadeOut();
      }
    });
}

function saveActivity(activity_id) {
  $.getJSON(domain + 'feeds/act_sv_person.php',{ token:token, activity_id: activity_id, action:($("#activity-" + activity_id).is(":checked")?'add':'delete')})
    .done(function(e) { if(handle_return(e)) {} })
    .fail(function(e) {handle_fail(e)});
}

function activityListExpand() {
    $.each( sports, function( key, value ) {
      var item = `<ons-list-item tappable expandable>
                                      <label class="left">
                                        <ons-checkbox input-id="check-`+ i +`"></ons-checkbox>
                                      </label>
                                      <label for="check-` + i++ + `" class="center">
                                        `+key+`
                                      </label><div class="expandable-content">
                                        <ons-list>`;
                                        $.each( value, function( key2, value2 ) {
                                              item = item + `<ons-list-item tappable>
                                                                <label class="left">
                                                                  <ons-checkbox input-id="check-`+key+'-'+key2+`" checked></ons-checkbox>
                                                                </label>
                                                                <label for="check-`+key+'-'+key2+`" class="center">
                                                                  `+value2+`
                                                                </label>
                                                              </ons-list-item>`;
                                        })
      item = item + `                 </ons-list>                 
                                    </div>
                                    </ons-list-item>
                                    `;
                                    
      var html = ons.createElement(item);
      $('#activity-list').append(html);
    });
   
}

var listHeader = function(text) {
  return ons.createElement(`<ons-list-header>${text}</ons-list-header>`); 
}

var listText = function(e) {
  var text = `
  <ons-input style="margin:10px; width:100%" setting_id="${e.setting_id}" modifier="underbar" placeholder="${e.name}" value="${e.value}" float></ons-input>
  `;
  return ons.createElement(text);
}

function loadSettings(person_id) {
    $("#load-modal").show();
    $.getJSON(domain + 'feeds/set_list.php',{token: token})
    .done(function(data) { if(handle_return(data)) {
       var old_category = '';
       $.each( data.results, function( key, value ) {
          if (value.category != old_category) {
            $("#settingList").append(listHeader(value.category));
          }
          old_category = value.category;
          if (value.type == 'boolean') {
            $("#settingList").append(listToggle({'caption':value.name,'item_id':value.setting_id,'checked':(value.value?'checked':''),'id':'settings_'+value.setting_id, 'feed':'set_sv_toggle'}));
          } else if (value.type == 'text')  {
            $("#settingList").append(listText({'name':value.name,'value':value.value, 'setting_id':value.setting_id}));
          }
       });
     } })
    .fail(function(e) {handle_fail(e)});
}

var handleToggle = function(elem_id) {
    $.getJSON(domain + 'feeds/'+$(elem_id).attr('feed')+'.php',{ token:token,
                                                                 setting_id: $(elem_id).attr('item_id'),
                                                                 value:     $("#" + elem_id.id)["0"].children["0"].checked })
    .done(function(e) { if(handle_return(e)) {} })
    .fail(function(e) {handle_fail(e)});
}

var listToggle = function(e) {
  var toggle = `
  <ons-list-item>
      <div class="center">
        ${e.caption}
      </div>
      <div class="right">
        <ons-switch ${e.checked} id="${e.id}" item_id="${e.item_id}" onChange="handleToggle(${e.id})" feed="${e.feed}"></ons-switch>
      </div>
    </ons-list-item>`;
  return ons.createElement(toggle);
}


var createCard = function(item) {
    var card = '';
    card = card +                               `<ons-card onclick=\'goPage(${item.attr})\'>`;
    if (item.rightpill != '') { card = card +      `<div class="right-pill">${item.rightpill}</div>`; }
    if (item.img != '') { card = card +            `<div class="thumbnail"><img src="${item.img}" width="50" height="50"/></div>`; }
    card = card +                                  `<div style='padding-left:60px'>`;
    if (item.title != '') { card = card +             `<div class="title">${item.caption}</div>`; }
    if (item.content != '') { card = card +           `<div class="content">${item.descr}</div>`; }
    card = card +                                  `</div>`;
    card = card +                               `</ons-card>`;
    return ons.createElement(card);
};

var createListItem = function (item,dir = 'left') {
    var listItem = '';
    listItem = listItem +                   `<ons-list-item onclick="${item.onClick}">`;
    if((typeof(item.img) != "undefined") != '') {
      listItem = listItem + `<div class="` + dir + `"><img class="list-item__thumbnail" src="${item.img}"></div>`
    };
    listItem = listItem +                      `<div class="center">${item.text}</div>`;
    listItem = listItem +                    `</ons-list-item>`;
    return ons.createElement(listItem);
  };

var createAlertCard = function(item) {
    return ons.createElement(`
          <ons-card onclick=\'fn.pushPage({"id": "${item.page}", "title": "&nbsp;&nbsp;&nbsp;${item.caption}"})\' modifier="material" style="background-color:#ffbfbf;text-align:center">
            <div class="title">${item.message}</div>
          </ons-card>
      `
    );
};




