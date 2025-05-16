import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from accounts.models import User
from .models import LiveStreaming, LiveAttendance

class LiveConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.live_id = self.scope['url_route']['kwargs']['live_id']
        self.room_group_name = f'live_{self.live_id}'
        
        # 加入房间
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # 发送欢迎消息
        if self.scope['user'].is_authenticated:
            await self.send(text_data=json.dumps({
                'type': 'system_message',
                'message': f'欢迎 {self.scope["user"].username} 加入直播间！'
            }))
            
            # 通知其他用户有新用户加入
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_join',
                    'message': f'{self.scope["user"].username} 加入了直播间',
                    'user': self.scope['user'].username
                }
            )
    
    async def disconnect(self, close_code):
        # 离开房间
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        # 通知其他用户有用户离开
        if self.scope['user'].is_authenticated:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_leave',
                    'message': f'{self.scope["user"].username} 离开了直播间',
                    'user': self.scope['user'].username
                }
            )
    
    # 接收客户端消息
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type', 'chat_message')
        
        if message_type == 'chat_message':
            message = text_data_json['message']
            
            # 保存消息到数据库(可选)
            # await self.save_message(message)
            
            # 发送消息到房间
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'user': self.scope['user'].username,
                    'avatar': self.scope['user'].avatar.url if self.scope['user'].avatar else None,
                    'time': text_data_json.get('time', '')
                }
            )
    
    # 处理聊天消息
    async def chat_message(self, event):
        message = event['message']
        user = event['user']
        avatar = event.get('avatar')
        time = event.get('time', '')
        
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message,
            'user': user,
            'avatar': avatar,
            'time': time
        }))
    
    # 处理用户加入消息
    async def user_join(self, event):
        message = event['message']
        user = event['user']
        
        await self.send(text_data=json.dumps({
            'type': 'user_join',
            'message': message,
            'user': user
        }))
    
    # 处理用户离开消息
    async def user_leave(self, event):
        message = event['message']
        user = event['user']
        
        await self.send(text_data=json.dumps({
            'type': 'user_leave',
            'message': message,
            'user': user
        }))
    
    # 保存消息到数据库(可选)
    @database_sync_to_async
    def save_message(self, message):
        # 这里可以实现消息保存到数据库的逻辑
        pass 