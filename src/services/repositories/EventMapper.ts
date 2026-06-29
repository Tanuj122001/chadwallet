import { NotificationDTO } from '../../core/api/NotificationDTOs';
import { AlertDTO } from '../../core/api/AlertDTOs';
import { Notification } from '../../core/models';

export class EventMapper {
  public static alertToNotificationDTO(alert: AlertDTO): NotificationDTO {
    return {
      notification_id: alert.alert_id,
      title: alert.title,
      body: alert.message,
      timestamp: alert.timestamp,
      is_read: alert.is_read,
      type: alert.type === 'price' ? 'price_alert' : 
            alert.type === 'security' ? 'security' : 
            alert.type === 'transaction' ? 'transaction' : 'general',
      payload: alert.payload,
    };
  }

  public static toNotificationModel(dto: NotificationDTO): Notification {
    return {
      id: dto.notification_id,
      title: dto.title,
      body: dto.body,
      timestamp: dto.timestamp,
      isRead: dto.is_read,
      type: dto.type,
    };
  }
}
