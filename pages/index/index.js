const app = getApp()
Page({
  data: {
    newsList: [],
    isThisShow: false,
    newsShow: true,
    isPanelShow: false,
    isMusicPlaying: true,
    systemInfo: {},
    message: "",
    simplePlayer: true,
    musicLrcObj: [],
    lrcString: "",
    showPasswordForm: false,
    placeholderDefault: "说点什么吧...",
    placeholderSearchImage: "关键词搜索表情",
    messageButtonTitleSend: "send",
    messageButtonTitleSearch: "search",
    messagePlaceHolder: "",
    messageConfirmHold: true,
    messageFocus: false,
    isScrollEnabled: true,
    imageList: [],
    emojiList: [],
    messageSendButton: "send",
    isEmojiBoxShow: false,
    isSystemEmoji: true,
    room_id: 0,
    default_room: 888,
    bottomHeight: 0,
    room_password: "",
    bbbug_view_id: "",
    bbbug_view_scroll: "",
    userInfo: {},
    roomInfo: {},
    songInfo: false,
    atMessageObj: false,
    websocket: {
      url: "",
      task: null,
      connected: false,
      forceStop: false,
      reconnectTimer: false,
      heartBeatTimer: false
    },
    messageList: [],
    historyMax: 20,
    touchStartTime: 0,
    touchEndTime: 0,
    touchStartPostion: false,
    isDoubleClick: false,
    isTouchMoved: false,
    touchTimer: false,
    clickTimer: false,
    enableTouchEnd: false,
  },
  setSimplePlayer() {
    wx.vibrateShort();
    this.setData({
      simplePlayer: !this.data.simplePlayer
    });
  },
  enableScroll() {
    this.setData({
      isScrollEnabled: true,
    });
    this.autoScroll();
  },
  touchStarted(e) {
    let that = this;
    that.data.touchStartTime = e.timeStamp;
    that.data.isTouchMoved = false;
    that.data.touchStartPostion = e.touches ? e.touches[0] : false;
    clearTimeout(that.data.touchTimer);
    that.data.touchTimer = setTimeout(function () {
      that.data.enableTouchEnd = false;
      if (!that.data.isTouchMoved) {
        that.longTapToAtUser(e.mark.user);
      }
    }, 500);
    that.data.enableTouchEnd = true;

    if (that.data.touchStartTime - that.data.touchEndTime < 300) {
      that.data.isDoubleClick = true;
      clearTimeout(that.data.clickTimer);
    } else {
      that.data.isDoubleClick = false;
    }
  },
  footerTapedToFocus() {
    this.setData({
      messageFocus: true
    });
  },
  messageBlured(e) {
    console.log(e);
    this.setData({
      message: e.detail.value,
      messageFocus: false
    });
  },
  messageFocused(e) {
    wx.vibrateShort();
    if (this.data.isEmojiBoxShow) {
      this.setData({
        imageList: [],
      });
    }
    this.setData({
      messageFocus: true
    });
  },
  touchMoving(e) {
    let that = this;
    if (e.touches && (e.touches[0].pageX != that.data.touchStartPostion.pageX || e.touches[0].pageY != that.data.touchStartPostion.pageY))
      that.data.isTouchMoved = true;
  },
  touchEnded(e) {
    let that = this;
    that.data.touchEndTime = e.timeStamp;
    clearTimeout(that.data.touchTimer);
    if (that.data.isTouchMoved) {
      return;
    }
    if (that.data.enableTouchEnd) {
      this.data.clickTimer = setTimeout(function () {
        if (that.data.isDoubleClick) {
          that.doTouchUser(e.mark.user.user_id);
        } else {
          if (!that.data.isTouchMoved) {
            that.userTap(e.mark.user);
          }
        }
        that.data.isDoubleClick = false;
      }, 300);
    }
  },
  doTouchUser(user_id) {
    let that = this;
    app.request({
      url: "message/touch",
      data: {
        at: user_id,
        room_id: that.data.room_id
      },
      success(res) {
        wx.vibrateLong();
      }
    });
  },
  messageListScrolling(e) {
    let res = wx.getSystemInfoSync();
    if (res.windowHeight + 50 < e.detail.scrollHeight - e.detail.scrollTop) {
      this.setData({
        isScrollEnabled: false
      });
    } else {
      this.setData({
        isScrollEnabled: true
      });
    }
  },
  onLoad: function (options) {
    let that = this;
    const updateManager = wx.getUpdateManager()
    updateManager.onUpdateReady(function () {
      updateManager.applyUpdate()
    });
    updateManager.onUpdateFailed(function () {});
    app.watchAccessToken(function () {
      that.getMyInfo();
    });
    if (options.scene) {
      wx.setStorageSync('room_id', options.scene);
    } else if (options.room_id) {
      wx.setStorageSync('room_id', options.room_id);
    }
    let emojiList = [];
    for (let i = 1; i <= 30; i++) {
      emojiList.push("/res/Emojis/" + i + ".png");
    }
    let systemInfo = wx.getSystemInfoSync();
    this.setData({
      bottomHeight: systemInfo.safeArea.bottom - systemInfo.safeArea.height + 40,
      emojiList: emojiList,
      imageList: emojiList,
      systemInfo: systemInfo,
      messagePlaceHolder: this.data.placeholderDefault,
    });
    let room_id = wx.getStorageSync('room_id') || this.data.default_room;
    this.setData({
      room_id: room_id
    });
    let access_token = wx.getStorageSync('access_token') || false;
    if (!access_token) {
      access_token = app.globalData.guestUserInfo.access_token;
      this.setData({
        userInfo: app.globalData.guestUserInfo
      });
    }

    let plat = systemInfo.platform.toLowerCase();
    if (plat == 'windows' || plat == 'mac') {
      wx.redirectTo({
        url: '../pc/index?bbbug=' + app.globalData.systemVersion + '&url=' + encodeURIComponent('https://bbbug.com'),
      });
      wx.hideHomeButton();
      return;
    }
    wx.setStorageSync('access_token', access_token);
    app.request({
      url: "",
      success(res) {
        if (res.data.success) {
          that.setData({
            newsShow: false
          });
          app.globalData.systemVersion = res.data.systemVersion;
          wx.setStorageSync('loadSuccess', 1);
          that.getMyInfo();
        } else {
          that.setData({
            newsList: res.data.data,
            newsShow: true
          });
          wx.setNavigationBarTitle({
            title: '每日推荐',
          });
          wx.showToast({
            title: '已更新',
          });
          let audio = wx.getBackgroundAudioManager();
          audio.src = 'http://img02.tuke88.com/newpreview_music/09/01/43/5c89e6ded0ebf83768.mp3';
          audio.title = "背景音乐";
          audio.play();
        }
      }
    });

    let audio = wx.getBackgroundAudioManager();
    audio.onTimeUpdate(function (e) {
      if (that.data.songInfo) {
        wx.getBackgroundAudioPlayerState({
          success(res) {
            if (that.data.musicLrcObj && res.status == 1) {
              for (let i = 0; i < that.data.musicLrcObj.length; i++) {
                if (i == that.data.musicLrcObj.length - 1) {
                  that.setData({
                    lrcString: that.data.musicLrcObj[i].lineLyric
                  });
                  return;
                } else {
                  if (res.currentPosition > that.data.musicLrcObj[i].time && res.currentPosition < that.data.musicLrcObj[i + 1].time) {
                    that.setData({
                      lrcString: that.data.musicLrcObj[i].lineLyric
                    });
                    return;
                  }
                }
              }
            }
          }
        });
      }
    });
  },
  doPasswordSubmit(e) {
    this.setData({
      room_password: e.detail.value.password
    });
    this.getRoomInfo();
  },
  openNewsDetail(e) {
    let id = e.mark.news_id;
    wx.navigateTo({
      url: '../other/detail?news_id=' + id,
    });
  },
  onShow: function () {
    let that = this;
    this.data.isThisShow = true;
  },
  onHide: function () {
    this.data.isThisShow = false;
  },
  clearAtInfo() {
    this.setData({
      atMessageObj: false
    });
  },
  getStaticUrl(str) {
    if (str.indexOf("https://") == 0 || str.indexOf("http://") == 0) {
      return str.replace("http://", "https://");
    } else {
      return app.globalData.request.cdnUrl + "/uploads/" + str;
    }
  },
  searchImages(message) {
    let that = this;
    app.request({
      url: "attach/search",
      data: {
        keyword: message
      },
      loading: "搜索中",
      success(res) {
        that.setData({
          imageList: res.data,
          isSystemEmoji: false
        });
      },
      error() {
        that.setData({
          imageList: that.data.emojiList
        });
      }
    });
  },
  sendMessage(e) {
    let that = this;
    let message = e.detail.value;
    if (!message) {
      return;
    }
    if (that.data.isEmojiBoxShow) {
      that.searchImages(message);
      return;
    }
    that.setData({
      message: ""
    });
    let message_send = message;
    if (that.data.atMessageObj) {
      message = "@" + decodeURIComponent(that.data.atMessageObj.user_name + " " + message,
        '');
    }
    let msgObj = {
      type: "text",
      content: message,
      where: "channel",
      at: that.data.atMessageObj,
      message_id: 0,
      message_time: 0,
      loading: true,
      resource: message,
      user: that.data.userInfo
    };
    that.addMessageToList(msgObj);
    let atUserInfo = that.data.atMessageObj;
    that.setData({
      atMessageObj: false
    });
    app.request({
      url: "message/send",
      data: {
        type: 'text',
        where: "channel",
        to: that.data.room_id,
        msg: encodeURIComponent(message_send),
        at: atUserInfo
      },
      success: function (res) {
        that.setData({
          atMessageObj: false,
          isScrollEnabled: true,
        });
        that.autoScroll();
      },
      error: function (res) {
        that.setData({
          message: message
        });
      }
    });
  },
  userTap(user) {
    let that = this;
    let menu = ['查看主页'];
    if ((that.data.userInfo.user_admin || that.data.userInfo.user_id == that.data.roomInfo.room_user) && that.data.userInfo.user_id != user.user_id) {
      menu = ['查看主页', '禁止点歌', '禁止发言', '解除限制'];
    }
    wx.showActionSheet({
      itemList: menu,
      success(res) {
        switch (menu[res.tapIndex]) {
          case '@Ta':
            that.longTapToAtUser(user);
            break;
          case '禁止点歌':
            app.request({
              url: 'user/songdown',
              data: {
                room_id: that.data.roomInfo.room_id,
                user_id: user.user_id
              },
              loading: "禁言中",
              success(res) {
                wx.showToast({
                  title: res.msg
                });
              }
            });
            break;
          case '禁止发言':
            app.request({
              url: 'user/shutdown',
              data: {
                room_id: that.data.roomInfo.room_id,
                user_id: user.user_id
              },
              loading: "禁言中",
              success(res) {
                wx.showToast({
                  title: res.msg
                });
              }
            });
            break;
          case '解除限制':
            app.request({
              url: 'user/removeban',
              data: {
                room_id: that.data.roomInfo.room_id,
                user_id: user.user_id
              },
              loading: "解禁中",
              success(res) {
                wx.showToast({
                  title: res.msg
                });
              }
            });
            break;
          case '查看主页':
            wx.navigateTo({
              url: '../user/profile?bbbug=' + app.globalData.systemVersion + '&user_id=' + user.user_id,
            })
            break;
          default:
            wx.showToast({
              title: '即将上线',
            });
        }
      }
    });
  },
  longTapToMessage(e) {
    let that = this;
    if (!that.data.userInfo || that.data.userInfo.user_id < 0) {
      return;
    }
    let msg = e.mark.msg;
    let menuList = ['引用消息'];
    if (msg.user.user_id == that.data.userInfo.user_id || that.data.userInfo.user_admin || that.data.userInfo.user_id == that.data.roomInfo.room_user) {
      //我发的消息 我是管理员 我是房主 给撤回按钮
      menuList.push('撤回消息');
    }
    switch (msg.type) {
      case 'img':
        // menuList.push('保存大图');
        break;
      case 'text':
        menuList.push('复制文字');
        break;
      case 'jump':
        menuList.push('进入房间');
        break;
      case 'link':
        menuList.push('复制链接');
        break;
      default:
    }
    wx.vibrateShort();
    wx.showActionSheet({
      itemList: menuList,
      success(res) {
        switch (menuList[res.tapIndex]) {
          case '复制文字':
            let copyData = decodeURIComponent(msg.content);
            if (msg.at) {
              copyData = "@" + decodeURIComponent(msg.at.user_name) + " " + copyData;
            }
            wx.setClipboardData({
              data: copyData,
            });
            // wx.showToast({
            //   title: '复制成功',
            // });
            break;
          case '引用消息':
            that.setData({
              messageFocus: true,
              atMessageObj: {
                user_id: msg.user.user_id,
                user_name: decodeURIComponent(msg.user.user_name),
                message: msg
              }
            });
            break;
          case '复制链接':
            wx.setClipboardData({
              data: decodeURIComponent(msg.link),
            });
            break;
          case '撤回消息':
            app.request({
              url: "message/back",
              loading: "撤回中",
              data: {
                message_id: msg.message_id,
                room_id: that.data.room_id
              },
              success(res) {

              }
            });
            break;
          case '进入房间':
            that.setData({
              room_id: msg.jump.room_id
            });
            that.getRoomInfo();
            break;
          default:
            wx.showToast({
              title: '即将上线',
            });
        }
      }
    });
  },
  longTapToAtUser(user) {
    this.setData({
      isPanelShow: false,
      atMessageObj: {
        user_id: user.user_id,
        user_name: decodeURIComponent(user.user_name),
      }
    });
    wx.vibrateShort();
  },
  sendEmoji(e) {
    let that = this;
    let url = false;
    if (e.mark.url.indexOf("/res/Emojis/") > -1) {
      url = app.globalData.request.cdnUrl + "/images/emoji/" + e.mark.url.replace('/res/Emojis/', '');
    } else {
      url = e.mark.url;
    }
    url = that.getStaticUrl(url);
    app.request({
      url: "message/send",
      data: {
        where: 'channel',
        to: that.data.room_id,
        type: 'img',
        msg: url,
        resource: url,
      },
      success(res) {
        that.hideAllDialog();
      }
    });
  },
  showOrHideEmojiBox() {
    if (this.data.isEmojiBoxShow) {
      this.setData({
        message: ""
      });
    } else {
      this.setData({
        imageList: this.data.emojiList,
        isSystemEmoji: true,
      });
    }
    this.setData({
      isPanelShow: false,
      isEmojiBoxShow: !this.data.isEmojiBoxShow,
    });

    wx.vibrateShort();
    this.setData({
      messageFocus: this.data.isEmojiBoxShow ? false : true,
      messagePlaceHolder: this.data.isEmojiBoxShow ? this.data.placeholderSearchImage : this.data.placeholderDefault,
      messageSendButton: this.data.isEmojiBoxShow ? this.data.messageButtonTitleSearch : this.data.messageButtonTitleSend,
      atMessageObj: false,
    });
  },
  hideAllDialog() {
    this.setData({
      isEmojiBoxShow: false,
      isPanelShow: false,
      messagePlaceHolder: this.data.placeholderDefault,
      messageSendButton: this.data.messageButtonTitleSend
    });
    wx.hideKeyboard();
  },
  previewImage(e) {
    let that = this;
    try {
      e.mark.url = decodeURIComponent(e.mark.url);
    } catch (e) {

    }
    if (e.mark.url) {
      if (e.mark.url.indexOf('images/emoji/') == -1 && e.mark.url.indexOf('/res/Emojis/') == -1) {
        wx.previewImage({
          current: that.getStaticUrl(e.mark.url),
          urls: [
            that.getStaticUrl(e.mark.url)
          ],
        });
      }
    }
  },
  login() {
    let that = this;
    wx.navigateTo({
      url: '../user/login?bbbug=' + app.globalData.systemVersion
    });
  },
  showSongMenu() {
    let that = this;
    let menu = ['收藏到歌单', '切歌&不喜欢'];
    if (that.data.isMusicPlaying) {
      menu.push('关闭音乐');
    } else {
      menu.push('打开音乐');
    }
    wx.showActionSheet({
      itemList: menu,
      success(res) {
        switch (menu[res.tapIndex]) {
          case '关闭音乐':
          case '打开音乐':
            if (that.data.isMusicPlaying) {
              let audio = wx.getBackgroundAudioManager();
              audio.stop();
              that.setData({
                isMusicPlaying: false
              });
            } else {
              that.setData({
                isMusicPlaying: true
              });
              that.playMusic(that.data.songInfo);
            }
            break;
          case '收藏到歌单':
            app.request({
              url: "song/addMySong",
              data: {
                room_id: app.globalData.roomInfo.room_id,
                mid: that.data.songInfo.song.mid,
              },
              loading: "收藏中",
              success: function (res) {
                wx.showToast({
                  title: "收藏成功"
                });
              }
            });
            break;
          case '切歌&不喜欢':
            let type = 'pass';
            if (that.data.roomInfo.room_user == that.data.userInfo.user_id || that.data.userInfo.user_admin || that.data.songInfo.user.user_id == that.data.userInfo.user_id) {
              type = 'pass';
            } else {
              type = 'vote';
            }
            app.request({
              url: "song/pass",
              data: {
                room_id: app.globalData.roomInfo.room_id,
                mid: that.data.songInfo.song.mid,
              },
              loading: type == 'pass' ? '切歌中' : '投票中',
              success: function (res) {
                if (type == 'pass') {
                  wx.showToast({
                    title: '切歌成功',
                  });
                } else {
                  wx.showModal({
                    title: "投票成功",
                    content: res.msg,
                    showCancel: false,
                  });
                }
              }
            });
            break;
          default:
        }
      }
    });
  },
  getMyInfo(reloadRoom = true) {
    let that = this;
    wx.showNavigationBarLoading();
    app.request({
      url: "user/getmyinfo",
      success(res) {
        that.setData({
          userInfo: res.data
        });
        app.globalData.userInfo = res.data;
        app.globalData.access_token_changed = false;
        wx.hideNavigationBarLoading();
        if (reloadRoom) {
          that.getRoomInfo();
        }
        that.alertChangeInfo();
      },
      error(res) {
        wx.hideNavigationBarLoading();
      }
    });
  },
  getMusicLrc() {
    let that = this;
    that.setData({
      musicLrcObj: [],
      lrcString: "歌词读取中..."
    });
    app.request({
      url: 'song/getLrc',
      data: {
        mid: that.data.songInfo.song.mid
      },
      success(res) {
        that.setData({
          musicLrcObj: res.data,
          lrcString: "歌词加载中..."
        });
      },
    });
  },
  alertChangeInfo() {
    let infoChanged = wx.getStorageSync('userInfoChanged') || false;
    if (!infoChanged && this.data.userInfo.user_id > 0) {
      wx.showModal({
        confirmText: "完善资料",
        cancelText: "不再提示",
        title: "修改资料",
        content: "快去完善资料展示自己的个性主页吧",
        success: function (res) {
          wx.setStorageSync('userInfoChanged', new Date().valueOf());
          if (res.confirm) {
            wx.navigateTo({
              url: '../user/motify',
            });
          }
        }
      });
    }
  },
  getRoomInfo() {
    let that = this;
    wx.showNavigationBarLoading();
    that.setData({
      showPasswordForm: false,
    });
    app.request({
      url: "room/getRoomInfo",
      data: {
        room_id: that.data.room_id,
        room_password: that.data.room_password
      },
      success(res) {
        wx.hideNavigationBarLoading();
        wx.hideLoading();
        that.setData({
          roomInfo: res.data
        });
        app.globalData.roomInfo = res.data;
        if (that.data.isThisShow) {
          wx.setNavigationBarTitle({
            title: res.data.room_name,
          });
        }
        that.getWebsocketUrl();
        that.getMessageList();
      },
      error(res) {
        wx.hideNavigationBarLoading();
        if (res.code == 302) {
          that.setData({
            showPasswordForm: true,
            room_password: "",
          });
          return true;
        }
      }
    });
  },
  doEnterDefaultRoom() {
    this.setData({
      room_id: this.data.default_room
    });
    this.getRoomInfo();
  },
  getMessageList() {
    let that = this;
    app.request({
      url: "message/getMessageList",
      data: {
        room_id: that.data.room_id,
        per_page: that.data.historyMax,
      },
      success(res) {
        let messageList = [];
        for (let i = 0; i < res.data.length; i++) {
          let _obj = false;
          try {
            _obj = JSON.parse(res.data[i].message_content);
          } catch (error) {
            continue;
          }
          if (_obj) {
            if (_obj.at) {
              _obj.content = '@' + _obj.at.user_name + " " + _obj.content;
            }
            _obj.message_time = res.data[i].message_createtime;
            _obj.isAtAll = false;
            if (_obj.type == 'text') {
              try {
                _obj.content = decodeURIComponent(decodeURIComponent(_obj.content));
              } catch (e) {
                _obj.content = decodeURIComponent(_obj.content);
              }
              _obj.isAtAll = decodeURIComponent(_obj.content).indexOf('@全体') == 0 && (_obj.user.user_id == that.data.roomInfo.room_user || _obj.user.user_admin) ? true : false;
            }
            messageList.unshift(_obj);
          }
        }
        that.setData({
          messageList: messageList
        });
        that.addSystemMessage(that.data.roomInfo.room_notice ? that.data.roomInfo.room_notice : ('欢迎来到' + that.data.roomInfo.room_name + '!'));
        that.autoScroll();
      }
    });
  },
  autoScroll() {
    let that = this;
    if (!that.data.isScrollEnabled) {
      return;
    }
    let view_id = "view_id_" + parseInt(Math.random() * 10000000);
    that.setData({
      bbbug_view_id: view_id
    });
    that.setData({
      bbbug_view_scroll: ""
    });
    that.setData({
      bbbug_view_scroll: view_id
    });
  },
  addSystemMessage(msg) {
    this.addMessageToList({
      type: "system",
      content: msg,
    });
  },
  getWebsocketUrl() {
    let that = this;
    wx.showNavigationBarLoading();
    app.request({
      url: "room/getWebsocketUrl",
      data: {
        channel: that.data.room_id,
      },
      success(res) {
        wx.hideNavigationBarLoading();
        that.data.websocket.url = 'wss://websocket.bbbug.com?account=' + res.data.account + "&channel=" + res.data.channel + "&ticket=" + res.data.ticket;
        that.connectWebsocket();
      },
      error(res) {
        wx.hideNavigationBarLoading();
      }
    });
  },
  connectWebsocket() {
    let that = this;
    if (that.data.websocket.connected) {
      that.data.websocket.forceStop = true;
      that.data.websocket.task.send({
        data: 'bye'
      });
      that.data.websocket.reconnectTimer = setTimeout(function () {
        that.connectWebsocket();
        console.log('waiting');
      }, 100);
    } else {
      that.data.websocket.task = wx.connectSocket({
        url: that.data.websocket.url,
      });
      that.data.websocket.task.onOpen(function () {
        that.data.websocket.forceStop = false;
        that.data.websocket.connected = true;
        that.websocketHeartBeat();
      });
      that.data.websocket.task.onMessage(function (data) {
        let msg = false;
        try {
          msg = JSON.parse(data.data);
        } catch (err) {
          return;
        }
        if (msg) {
          that.messageController(msg);
        }
      });
      that.data.websocket.task.onClose(function () {
        that.data.websocket.connected = false;
        that.data.websocket.task = null;
        if (!that.data.websocket.forceStop) {
          that.reconnectWebsocket();
        }
      });
    }
  },
  addMessageToList(msg) {
    let that = this;
    if (that.data.messageList.length > that.data.historyMax) {
      that.data.messageList.shift();
    }
    that.data.messageList.push(msg);
    that.setData({
      messageList: that.data.messageList
    });
    that.autoScroll();
  },
  reconnectWebsocket() {
    let that = this;
    if (!that.data.websocket.connected) {
      that.connectWebsocket();
    }
  },
  websocketHeartBeat() {
    let that = this;
    if (that.data.websocket.connected) {
      that.data.websocket.task.send({
        data: "heartBeat"
      });
      clearTimeout(that.data.websocket.heartBeatTimer);
      that.data.websocket.heartBeatTimer = setTimeout(function () {
        that.websocketHeartBeat();
      }, 10000);
    }
  },
  messageController(msg) {
    let that = this;
    switch (msg.type) {
      case 'touch':
        that.addSystemMessage(decodeURIComponent(msg.user.user_name) + " 摸了摸 " + decodeURIComponent(msg.at.user_name) + msg.at.user_touchtip, '#999', '#eee');
        if (msg.at) {
          if (msg.at.user_id == that.data.userInfo.user_id) {
            wx.vibrateLong();
          }
        }
        break;
      case 'join':
        msg.content = msg.content;
        msg.type = 'system';
        that.addMessageToList(msg);
        break;
      case 'text':
      case 'img':
      case 'link':
      case 'jump':
      case 'system':
        if (msg.type == 'text') {
          try {
            msg.content = decodeURIComponent(decodeURIComponent(msg.content));
          } catch (e) {
            msg.content = decodeURIComponent(msg.content);
          }
          if (msg.at) {
            msg.content = "@" + decodeURIComponent(msg.at.user_name) + " " + msg.content;
          }
          for (let i = 0; i < that.data.messageList.length; i++) {
            if (that.data.messageList[i].loading) {
              that.data.messageList.splice(i, 1);
            }
          }
        }
        that.addMessageToList(msg);
        break;
      case 'addSong':
        if (msg.at) {
          that.addSystemMessage(decodeURIComponent(msg.user.user_name) + " 送了一首 《" + msg.song.name + "》 给 " +
            decodeURIComponent(msg.at.user_name), '#333');
        } else {
          that.addSystemMessage(decodeURIComponent(msg.user.user_name) + " 点了一首《" + msg.song.name + "》", '#333');
        }

        break;
      case 'pass':
        that.addSystemMessage(decodeURIComponent(msg.user.user_name) + " 切掉了《" + msg.song.name + "》", '#ff4500');

        break;
      case 'push':
        that.addSystemMessage(decodeURIComponent(msg.user.user_name) + " 将歌曲 《" + msg.song.name + "》 设为置顶候播放");

        break;
      case 'removeSong':
        that.addSystemMessage(decodeURIComponent(msg.user.user_name) + " 将歌曲 《" + msg.song.name + "》 从队列移除");

        break;
      case 'removeban':
        that.addSystemMessage(decodeURIComponent(msg.user.user_name) + " 将 " + decodeURIComponent(msg.ban.user_name) +
          " 解禁");

        break;
      case 'shutdown':
        that.addSystemMessage(decodeURIComponent(msg.user.user_name) + " 禁止了用户 " + decodeURIComponent(msg.ban.user_name) +
          " 发言");

        break;
      case 'songdown':
        that.addSystemMessage(decodeURIComponent(msg.user.user_name) + " 禁止了用户 " + decodeURIComponent(msg.ban.user_name) +
          " 点歌");

        break;
      case 'back':
        for (let i = 0; i < that.data.messageList.length; i++) {
          if (that.data.messageList[i].message_id == msg.message_id) {
            that.data.messageList.splice(i, 1);
            break;
          }
        }
        that.setData({
          messageList: that.data.messageList
        });
        that.addSystemMessage(decodeURIComponent(msg.user.user_name) + " 撤回了一条消息");

        break;
      case 'playSong':
        if (msg && msg.song && msg.user) {
          that.playMusic(msg);
        }
        break;
      case 'all':
        that.addSystemMessage(msg.content);
        break;
      case 'online':
        if (that.data.isThisShow) {
          wx.setNavigationBarTitle({
            title: that.data.roomInfo.room_name + '(' + msg.data.length + ')',
          });
        }
        break;
      case 'roomUpdate':
        that.getRoomInfo();
        break;
      default:
        console.log("消息未解析")
    }
    that.autoScroll();
  },
  onShareAppMessage() {
    let that = this;
    if (that.data.songInfo) {
      return {
        title: '正在播放 ' + that.data.songInfo.song.name + '(' + that.data.songInfo.song.singer + ")",
        path: '/pages/index/index?room_id=' + that.data.room_id
      };
    }
  },
  playMusic(msg) {
    let that = this;
    that.setData({
      songInfo: msg
    });
    that.getMusicLrc();
    for (let i = 0; i < that.data.messageList.length; i++) {
      if (that.data.messageList[i].type == 'play') {
        that.data.messageList.splice(i, 1);
        break;
      }
    }
    that.data.messageList.push({
      type: 'play',
      data: msg
    });
    that.setData({
      messageList: that.data.messageList
    });

    let audio = wx.getBackgroundAudioManager();
    audio.src = app.globalData.request.apiUrl + '/song/playurl?mid=' + msg.song.mid;
    audio.title = msg.song.name + ' - ' + msg.song.singer;
    audio.singer = "点歌人: " + decodeURIComponent(msg.user.user_name) + " " + that.data.roomInfo.room_name + "";
    // audio.epname = "(" + that.data.roomInfo.room_name + ")";
    audio.coverImgUrl = msg.song.pic;
    audio.webUrl = msg.song.pic;
    audio.seek(parseInt(new Date().valueOf() / 1000) - msg.since);
    if (that.data.isMusicPlaying) {
      that.addSystemMessage('正在播放 ' + decodeURIComponent(msg.user.user_name) + ' 点的 ' + msg.song.name + '(' + msg.song.singer + ')');
      audio.play();
    } else {
      audio.stop();
    }
  },
  chooseImage() {
    let that = this;
    wx.chooseImage({
      count: 1,
      sizeType: 'compressed',
      success(res) {
        that.hideAllDialog();
        wx.showLoading({
          title: '发送中',
        });
        wx.uploadFile({
          url: app.globalData.request.apiUrl + "attach/uploadImage",
          filePath: res.tempFilePaths[0],
          name: 'file',
          formData: app.globalData.request.baseData,
          success(res) {
            wx.hideLoading();
            res.data = JSON.parse(res.data);
            if (res.data.code == 200) {
              let url = app.globalData.request.cdnUrl + "/uploads/" + res.data.data.attach_path;
              app.request({
                url: "message/send",
                data: {
                  where: 'channel',
                  to: that.data.room_id,
                  type: 'img',
                  msg: url,
                  resource: url,
                },
                success(res) {
                  that.hideAllDialog();
                }
              });
            } else {
              wx.showModal({
                title: "上传失败(" + res.data.code + ")",
                content: res.data.msg,
                showCancel: false
              });
            }
          },
        })
      },
    });
  },
  mainMenuClicked(e) {
    let that = this;
    switch (e.mark.title) {
      case '点歌':
        wx.navigateTo({
          url: '../song/select?bbbug=' + app.globalData.systemVersion,
        });
        break;
      case '已点':
        wx.navigateTo({
          url: '../song/playing?bbbug=' + app.globalData.systemVersion,
        });
        break;
      case '歌单':
        wx.navigateTo({
          url: '../song/my?bbbug=' + app.globalData.systemVersion,
        });
        break;
      case '在线':
        wx.navigateTo({
          url: '../user/online?bbbug=' + app.globalData.systemVersion,
          events: {
            doAtUser: function (userInfo) {
              that.longTapToAtUser(userInfo)
            },
            doTouchUser: function (user_id) {
              that.doTouchUser(user_id);
            },
          }
        });
        break;
      case '换房':
        wx.navigateTo({
          url: '../room/select?bbbug=' + app.globalData.systemVersion,
          events: {
            changeRoomSuccess: function (room_id) {
              that.setData({
                room_id: room_id
              });
              that.setData({
                songInfo: false
              });
              let audio = wx.getBackgroundAudioManager();
              audio.stop();
              that.getRoomInfo();
            }
          }
        });
        break;
      case '注销':
        app.globalData.userInfo = app.globalData.guestUserInfo;
        app.globalData.request.baseData.access_token = app.globalData.guestUserInfo.access_token;
        wx.setStorageSync('access_token', app.globalData.guestUserInfo.access_token);
        that.setData({
          userInfo: app.globalData.userInfo
        });
        that.getMyInfo();
        break;
      case '资料':
        wx.navigateTo({
          url: '../user/motify',
          events: {
            myInfoChanged: function () {
              that.getMyInfo(false);
            }
          }
        });
        break;
      case '管理':
        wx.navigateTo({
          url: '../room/motify?bbbug=' + app.globalData.systemVersion,
          events: {
            reloadMessage: function () {
              that.getMessageList();
            },
          }
        });
        break;
      case '分享':
        let imgUrl = 'https://api.bbbug.com/api/weapp/qrcode?room_id=' + that.data.room_id;
        wx.previewImage({
          urls: [imgUrl],
          current: imgUrl
        });
        break;
      default:
    }
  },
  showMainMenu() {
    let that = this;
    wx.vibrateShort();
    that.setData({
      isPanelShow: !that.data.isPanelShow,
      isEmojiBoxShow: false,
    });
  },
})