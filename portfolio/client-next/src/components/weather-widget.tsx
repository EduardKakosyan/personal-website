"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WeatherData {
  location: {
    timezone: string;
    timezoneAbbreviation: string;
    latitude: number;
    longitude: number;
    city: string;
  };
  current: {
    time: string;
    temperature: number;
    humidity: number;
  };
  hourly: {
    time: string[];
    temperature: number[];
  };
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5175/api/weather");

        if (response.data.status === "success") {
          setWeather(response.data.data);
        } else {
          setError("Failed to fetch weather data");
        }
      } catch (err) {
        console.error("Error fetching weather data:", err);
        setError("An error occurred while fetching weather data");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Weather</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Weather</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4">
            <p className="text-red-500">
              {error || "Failed to load weather data"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format date
  const date = new Date(weather.current.time);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Weather</span>
          <span className="text-sm font-normal text-muted-foreground">
            {weather.location.city}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold">
                {Math.round(weather.current.temperature)}°C
              </p>
              <p className="text-sm text-muted-foreground">
                Humidity: {Math.round(weather.current.humidity)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{formattedDate}</p>
              <p className="text-sm text-muted-foreground">{formattedTime}</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Today&apos;s Forecast</h4>
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {weather.hourly.time.slice(0, 8).map((time, index) => {
                const hourTime = new Date(time);
                const hour = hourTime.getHours();
                const hourLabel =
                  hour === 0
                    ? "12 AM"
                    : hour === 12
                    ? "12 PM"
                    : hour > 12
                    ? `${hour - 12} PM`
                    : `${hour} AM`;

                return (
                  <div
                    key={index}
                    className="flex flex-col items-center min-w-[60px]"
                  >
                    <span className="text-xs text-muted-foreground">
                      {hourLabel}
                    </span>
                    <span className="text-sm font-medium my-1">
                      {Math.round(weather.hourly.temperature[index])}°C
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
