import { Trip } from '../../types/database';
import { notificationService, TripReminder } from './notificationService';

export class TripNotificationManager {
  // set up all notifications for a trip
  static async setupTripNotifications(trip: Trip): Promise<void> {
    try {
      if (!trip.start_date || !trip.end_date) {
        return;
      }

      // parse trip date and set a reasonable departure time (9 AM)
      const tripDate = new Date(trip.start_date);
      const departureDateTime = new Date(tripDate);
      departureDateTime.setHours(9, 0, 0, 0); // set to 9 AM on departure date
      
      const now = new Date();
      const departureTimestamp = departureDateTime.getTime();

      // only set up notifications if trip is actually in the future
      if (departureTimestamp <= now.getTime()) {
        return;
      }

      const reminders: TripReminder[] = [];

      // 1. Packing reminder (24 hours before departure)
      const packingTime = departureTimestamp - (24 * 60 * 60 * 1000);
      if (packingTime > now.getTime()) {
        reminders.push({
          tripId: trip.id,
          type: 'packing',
          scheduledTime: packingTime,
          title: `📦 Pack for ${trip.name}`,
          body: `Your trip to ${trip.destination} starts tomorrow at 9 AM. Time to start packing!`,
          data: { 
            tripId: trip.id, 
            type: 'packing',
            tripName: trip.name,
            destination: trip.destination
          }
        });
      }

      // 2. Check-in reminder (2 hours before departure)
      const checkinTime = departureTimestamp - (2 * 60 * 60 * 1000);
      if (checkinTime > now.getTime()) {
        reminders.push({
          tripId: trip.id,
          type: 'check_in',
          scheduledTime: checkinTime,
          title: `✈️ Check-in for ${trip.name}`,
          body: `Don't forget to check-in for your flight to ${trip.destination}!`,
          data: { 
            tripId: trip.id, 
            type: 'check_in',
            tripName: trip.name,
            destination: trip.destination
          }
        });
      }

      // 3. Departure reminder (30 minutes before departure)
      const departureReminderTime = departureTimestamp - (30 * 60 * 1000);
      if (departureReminderTime > now.getTime()) {
        reminders.push({
          tripId: trip.id,
          type: 'departure',
          scheduledTime: departureReminderTime,
          title: `🛫 Time to leave for ${trip.name}!`,
          body: `Your trip to ${trip.destination} starts soon. Safe travels!`,
          data: { 
            tripId: trip.id, 
            type: 'departure',
            tripName: trip.name,
            destination: trip.destination
          }
        });
      }

      // 4. Activity reminders (if activities are planned)
      if (trip.activities && Array.isArray(trip.activities)) {
        for (const activity of trip.activities) {
          if (activity.date) {
            const activityDate = new Date(activity.date);
            // set activity time to a reasonable hour if not specified
            if (activityDate.getHours() === 0 && activityDate.getMinutes() === 0) {
              activityDate.setHours(14, 0, 0, 0); // default to 2 PM
            }
            
            const activityReminder = activityDate.getTime() - (60 * 60 * 1000); // 1 hour before
            
            if (activityReminder > now.getTime()) {
              reminders.push({
                tripId: trip.id,
                type: 'activity',
                scheduledTime: activityReminder,
                title: `📅 Upcoming: ${activity.name}`,
                body: `Your ${activity.name} activity starts in 1 hour!`,
                data: { 
                  tripId: trip.id, 
                  type: 'activity', 
                  activityId: activity.id,
                  activityName: activity.name,
                  tripName: trip.name,
                  destination: trip.destination
                }
              });
            }
          }
        }
      }

      // schedule all reminders
      for (const reminder of reminders) {
        try {
          await notificationService.scheduleTripReminder(reminder);
        } catch (error) {
          console.error(`❌ Failed to schedule ${reminder.type} reminder:`, error);
        }
      }
      
      if (reminders.length === 0) {
        console.log(`⚠️ No future notifications scheduled for trip ${trip.name} (departure: ${departureDateTime.toLocaleString()})`);
      }
    } catch (error) {
      console.error('Failed to setup trip notifications:', error);
    }
  }

  // set up location-based notifications for a trip
  static async setupLocationNotifications(trip: Trip): Promise<void> {
    // removed location based notifications for now
    return;
  }

  // send weather-based notifications TODO:: is this using the api weather service?
  static async sendWeatherAlert(trip: Trip, weather: any): Promise<void> {
    try {
      let alertTitle = '';
      let alertBody = '';
      let priority: 'low' | 'normal' | 'high' = 'normal';

      // check for severe weather conditions
      if (weather.alerts && weather.alerts.length > 0) {
        const alert = weather.alerts[0];
        alertTitle = `Weather Alert: ${trip.destination}`;
        alertBody = `${alert.title}: ${alert.description}`;
        priority = 'high';
      }
      // check for rain
      else if (weather.current && weather.current.weather[0].main === 'Rain') {
        alertTitle = `Rain Expected in ${trip.destination}`;
        alertBody = 'Pack an umbrella or plan indoor activities for today!';
        priority = 'normal';
      }
      // check for extreme temperatures
      else if (weather.current && (weather.current.temp > 35 || weather.current.temp < 0)) {
        alertTitle = `Extreme Temperature in ${trip.destination}`;
        alertBody = weather.current.temp > 35 
          ? 'Very hot weather expected. Stay hydrated and seek shade!'
          : 'Very cold weather expected. Dress warmly!';
        priority = 'normal';
      }

      if (alertTitle) {
        await notificationService.sendImmediateNotification(
          alertTitle,
          alertBody,
          {
            tripId: trip.id,
            type: 'weather_alert',
            destination: trip.destination,
            weather: weather.current
          },
          priority
        );
      }
    } catch (error) {
      console.error('Failed to send weather alert:', error);
    }
  }

  // send activity suggestions based on location and time TODO: does this even work? if yes, how to test?
  static async sendActivitySuggestion(trip: Trip, userLocation?: { latitude: number; longitude: number }): Promise<void> {
    try {
      const suggestions = [
        'Try the local coffee shop around the corner!',
        'Visit the nearby museum - it has great reviews.',
        'Perfect weather for a walking tour of the historic district.',
        'Local food market is open until 6 PM - great for authentic cuisine!',
        'Sunset viewing spot is just 10 minutes away.',
      ];

      const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

      await notificationService.sendImmediateNotification(
        `Activity Suggestion in ${trip.destination}`,
        randomSuggestion,
        {
          tripId: trip.id,
          type: 'activity_suggestion',
          destination: trip.destination,
          userLocation
        },
        'low'
      );
    } catch (error) {
      console.error('Failed to send activity suggestion:', error);
    }
  }

  // clean up all notifications for a trip
  static async cleanupTripNotifications(tripId: string): Promise<void> {
    try {
      await notificationService.cancelTripReminders(tripId);
    } catch (error) {
      console.error('Failed to cleanup trip notifications:', error);
    }
  }
}
