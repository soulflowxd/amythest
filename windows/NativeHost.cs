using System;

namespace Amythest.Windows
{
    internal static class NativeHostProgram
    {
        private static int Main(string[] args)
        {
            return NativeBridge.RunHost(Console.OpenStandardInput(), Console.OpenStandardOutput(), NativeBridge.DataFolder);
        }
    }
}
